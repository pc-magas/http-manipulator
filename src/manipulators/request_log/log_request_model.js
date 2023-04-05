const { getReqMime,detectBodyMime,checkEncodeURI } = require('../../common/http_utils');

const url = require('url');
const fs  = require('node:fs');
const busboy = require('busboy');

/**
 * Save request headers into the database
 * @param {*} db 
 * @param {*} req 
 * @param {*} insertId 
 */
const log_request_headers = (db,req,insertId) =>{
    
    const header_query = `
        INSERT into http_headers (request_id,name,value,is_response) VALUES (
            :request_id,
            :name,
            :value,
            0
        );
    `;

    const headerInsert = db.prepare(header_query);

    const transaction =  db.transaction((headers) => {
        Object.keys(headers).forEach( name => {
            const value = headers[name];

            headerInsert.run({
                "name": name,
                "value":value,
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
const log_url_params = (db,params,request_id) => {

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

    Object.keys(params).forEach( param_name => {
        const value = params[param_name];
        url_params_query.run({
            'request_id':request_id,
            'name':param_name,
            'value': value
        });
    });

};


const log_request_body = (db,path,req,insert_id,callback)=> {
   
    const update_request_detected_mime = (mime,path)=>{
        const detectedMimeSql = `UPDATE requests SET response_mime_tetected=:mime,parsed_request_body_file=:path WHERE id = :id`
        const stmt = db.prepare(detectedMimeSql);
        stmt.run({
            'id':insert_id,
            'mime':mime,
            'path':path
        });
    }

    const path_to_save = path.join(path,insert_id+"_body.raw");
    const parsedPath = path.join(path,insert_id+"_body");

    var body = [];
    
    req.on('data',(data)=> body.push(data));

    req.on('end',() => {
        body = body.toString();
        if(body){
            fs.writeFileSync(path_to_save,body);

            const bodyPathSql = `UPDATE requests SET raw_request_body_file=:path WHERE id = :id`
            const stmt = db.prepare(bodyPathSql);
            stmt.run({
                'id':insert_id,
                "path":path_to_save
            });

            if(
                typeof req.headers['content-type']!== 'undefined' && 
                (req.headers['content-type'] === 'multipart/formdata' || req.headers['content-type'] === 'application/x-www-form-urlencoded')
            ){

                update_request_detected_mime(req.headers['content-type'],null);
                const bb = busboy({ headers: req.headers['content-type'] });

                const sql = `
                    INSERT INTO
                        request_http_params (request_id,name,value,value_in_file,param_location)
                    VALUES (
                        :id,
                        :name,
                        :value,
                        :value_in_file,
                        'BODY'
                    )
                `;

                const stmt = db.prepare(sql);
                bb.on('file', (name, file, info) => {
                    const { filename } = info;

                    const multipart_Uploads = path.join(path,insert_id,"multipart",filename);

                    const fstream = fs.createWriteStream(multipart_Uploads);
                    file.pipe(fstream);
                    fstream.on('close', function () {    
                       stmt.execute({
                        'id':insert_id,
                        'name':name,
                        'value':multipart_Uploads,
                        'value_in_file':1
                       });
                    });
                });

                bb.on('field', (name, val, info) => {
                    stmt.execute({
                        'id':insert_id,
                        'name':name,
                        'value':val,
                        'value_in_file':0
                       });
                });

                bb.on('finish',()=>{
                    callback(null);
                });

                req.pipe(req.busboy);
                return;
            }

            return detectBodyMime(body,(err,mime,extention,buffer)=>{
                if (err) {return;}

                var Readable = require('stream').Readable;
                const s = new Readable()
                s.push(buffer)   
                s.push(null) 
                const finalPath = parsedPath+'.'+extention
                s.pipe(fs.createWriteStream(finalPath));

                update_request_detected_mime(mime,finalPath);
                callback(null);
            });            
        } else {
            callback(null);
        }
   });
}

const request_log = (db,request_log_save_path,req,use_in_https,callback) => {
    const initialInsert = `
        INSERT INTO requests (
            method,
            domain,
            protocol,
            path,
            path_without_params,
            request_mime,
            request_timestamp_unix_nanosecond,
        ) VALUES (
            :method,
            :domain,
            :protocol,
            :path,
            :path_without_params,
            :request_mime,
            :insert_time,
        ) RETURNING id;
    `;


    const initialInsertStmt  = db.prepare(initialInsert);
    
    const queryData = url.parse(req.url, true);

    try {    
        db.prepare("BEGIN DEFERRED TRASNACTION ");

        const insert_result = initialInsertStmt.run({
                    "method":req.method,
                    "domain":req.headers.host,
                    "path": queryData.href,
                    "path_without_params": queryData.pathname,
                    "protocol":use_in_https?'https':'http',
                    "request_mime":getReqMime(req)});
            
        var insertId = insert_result.lastInsertRowid;

        db.prepare("COMMIT");
    } catch (e) {
        db.prepare("ROLLBACK");
    }

    log_url_params(db,queryData.query,insertId);
    log_request_headers(db,req,insertId);
    log_request_body(db,request_log_save_path,insertId)
    
    callback(null,insertId);  
}

module.exports={request_log};