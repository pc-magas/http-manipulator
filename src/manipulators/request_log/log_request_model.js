const { getReqMime } = require('../../common/http_utils/http_utils.js');

const detectBodyMime = require('../../common/http_utils/body.js');
const {flags,parseMultipart} = require('../../common/multipart.js');

const url = require('url');
const fs = require('node:fs');
const path = require('path');

const {Readable,PassThrough}= require('stream');
const querystring = require("node:querystring");

/**
 * Save request headers into the database
 * @param {*} db 
 * @param {http.ClientRequest} req 
 * @param {int} insertId 
 */
const log_request_headers = (db, req, insertId) => {

    const header_query = `
        INSERT into http_headers (request_id,name,value,is_response) VALUES (
            :request_id,
            :name,
            :value,
            0
        );
    `;

    const headerInsert = db.prepare(header_query);

    const transaction = db.transaction((headers) => {
        Object.keys(headers).forEach(name => {
            const value = headers[name];

            headerInsert.run({
                "name": name,
                "value": value,
                "request_id": insertId
            });
        });
    });
    transaction(req.headers);
}

/**
 * Save url query params as seperate values in the database
 * @param {} db Db connection
 * @param {Object} params url 
 * @param {Numeric} request_id Id containing the request 
 */
const log_url_params = (db, params, request_id) => {

    const query = `
        INSERT INTO 
            request_http_params (request_id,param_location,name,value)
        VALUES (
            :request_id,
            'URL',
            :name,
            :value
        )
    `;

    const url_params_query = db.prepare(query);

    Object.keys(params).forEach(param_name => {
        const value = params[param_name];
        url_params_query.run({
            'request_id': request_id,
            'name': param_name,
            'value': value
        });
    });

};

const log_body_form_urlencoded = (db, buffer, insert_id) => {
    const sql = `
        INSERT INTO 
        request_http_params (
            request_id,
            name,
            value,
            value_is_array,
            value_index,
            param_location
        )
        VALUES (
            :id,
            :name,
            :value,
            :value_is_array,
            :value_index,
            'BODY'
        );
    `;

    const stmt = db.prepare(sql);
    const parsedData = { ...querystring.parse(buffer.toString()) };
    
    Object.keys(parsedData).forEach((key) => {
        const value = parsedData[key];
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                stmt.run({
                    'id':insert_id,
                    'name':key,
                    'value_is_array':1,
                    'value_index':index,
                    'value':item
                });
            });

            return;
        }

        stmt.run({
            'id':insert_id,
            'name':key,
            'value_is_array':0,
            'value_index':null,
            'value':value
        });
    });
};

const mkPaths = (saved_path,insert_id)=>{

    const requestBasePath = path.join(saved_path,""+insert_id);
    const multipartSavePath = path.join(requestBasePath,'multipart');
    const unparsedBodyPath = path.join(requestBasePath,'body.raw');
    const parsedBodyPath = path.join(requestBasePath,'body.raw');

    !fs.existsSync(multipartSavePath) && fs.mkdirSync(multipartSavePath,{recursive: true});

    return {requestBasePath,multipartSavePath,unparsedBodyPath,parsedBodyPath};
}

const log_multipart_field = (db,fieldname,contents,content_is_file) => {
    const sql = `
        INSERT INTO 
        request_http_params (
            request_id,
            name,
            value,
            value_in_file,
            param_location
        )
        VALUES (
            :id,
            :name,
            :value,
            :value_in_file,
            'BODY'
        );
    `;

    const stmt = db.prepare(sql);

    stmt.run({
        'value_in_file':content_is_file,
        'name':fieldname,
        'value':contents
    });
}

const log_request_body = (db, saved_path, req, insert_id, callback) => {

    const update_request_detected_mime = (mime, saved_path) => {
        const detectedMimeSql = `UPDATE requests SET response_mime_tetected=:mime,parsed_request_body_file=:path WHERE id = :id`
        const stmt = db.prepare(detectedMimeSql);
        stmt.run({
            'id': insert_id,
            'mime': mime,
            'path': saved_path
        });
    }

    const paths = mkPaths(saved_path,insert_id);

    
    const unparsedBody = paths.unparsedBodyPath;
    const parsedPath = paths.parsedBodyPath;

    var body = [];

    req.on('data', (data) => body.push(data));

    req.on('end', () => {
        body = body.toString();
        if (!body || body.length === 0) {
            return callback(null);
        }
        fs.writeFileSync(unparsedBody, body);

        const bodyPathSql = `UPDATE requests SET raw_request_body_file=:path WHERE id = :id`
        const stmt = db.prepare(bodyPathSql);
        stmt.run({
            'id': insert_id,
            "path": unparsedBody
        });

        // I ignore content-type because I do not trust the header. 
        // Content-Type header can be anything that body indicates and I want to cover this edge case.
        return detectBodyMime(body, (err, mime, extention, buffer) => {
            if (err) { return; }

            if (mime == 'application/x-www-form-urlencoded') {
                log_body_form_urlencoded(db,buffer,insert_id);
            }

            const s = new Readable()
            const filePassthrough = new PassThrough();
            s.pipe(filePassthrough);
            s.push(buffer)
            s.push(null)

            // Content can be base64 I want to capture in seperate file both base64 and non-base64 http body.
            const finalPath = parsedPath + '.' + extention
            filePassthrough.pipe(fs.createWriteStream(finalPath));

            if(mime == 'multipart/form-data'){

                const fieldCallback=(error,fieldName,fieldContent,isFile,filename,detectedMime,contentTypeLine,fieldFlags)=>{
                    if(error){return;} // I cannot a better idea on how will make sense to somehow log this line
                    let final_filename=isFile?path.join(paths.multipartSavePath,filename):null;
                    if(final_filename!=null){
                        fs.writeFileSync(final_filename,fieldContent);
                        log_body_form_urlencoded(db,fieldName,final_filename,1);
                        
                        return;
                    }
                    
                    log_body_form_urlencoded(db,fieldName,fieldContent,0);
                };

                const doneCallback=(fieldCount,flags)=>{
                    update_request_detected_mime('multipart/form-data', finalPath);
                    callback(null);
                };

                parseMultipart(body,null,fieldCallback,doneCallback)
                
            } else {
                update_request_detected_mime(mime, finalPath);
                callback(null);
            }
        });

    });
}

const request_log_basics = (db, request_log_save_path, req, use_in_https, callback) => {
    const initialInsert = `
        INSERT INTO requests (
            method,
            domain,
            protocol,
            path,
            path_without_params,
            request_mime,
            request_timestamp_unix_nanosecond
        ) VALUES (
            :method,
            :domain,
            :protocol,
            :path,
            :path_without_params,
            :request_mime,
            :insert_time
        ) RETURNING id;
    `;


    const initialInsertStmt = db.prepare(initialInsert);

    const queryData = url.parse(req.url, true);

    try {
        db.prepare("BEGIN DEFERRED TRANSACTION");

        const insert_result = initialInsertStmt.run({
            "method": req.method,
            "domain": req.headers.host,
            "path": queryData.href,
            "path_without_params": queryData.pathname,
            "protocol": use_in_https ? 'https' : 'http',
            "request_mime": getReqMime(req),
            "insert_time": Date.now()
        });

        var insertId = insert_result.lastInsertRowid;

        db.prepare("COMMIT");
    } catch (e) {
        db.prepare("ROLLBACK");
        return callback(e, null);
    }

    log_url_params(db, queryData.query, insertId);
    log_request_headers(db, req, insertId);
    log_request_body(db, request_log_save_path, req, insertId, () => {
        callback(null, insertId);
    });
}

module.exports = request_log_basics;