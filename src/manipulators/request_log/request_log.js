const { hrtime } = require('node:process');

const { getReqMime,parseResponseCookie,detectBodyMime,checkEncodeURI } = require('../../common/http_utils');

const connect = require('connect');
const url = require('url');
const cookieParser = require('cookie-parser');
const fs  = require('node:fs');
const busboy = require('busboy');

/**
 * Update request entry Upon response with nessesary values
 * @param {*} db 
 * @param {*} res 
 * @param {Int} insertId 
 */
const updateResponse = (db,res,insertId) => {

    const query = `
        UPDATE requests SET 
            response_status_code = :status_code,
            response_timestamp_unix_nanosecond = :response_timestamp
        WHERE 
            id = :id
    `;
    const statement = db.prepare(query);
   
    const transaction =  db.transaction((value)=> {
        statement.run(value);       
    });

    transaction({
        "status_code": res.statusCode,
        "response_timestamp": hrtime.bigint(),
        'id': insertId
    });
        
    insertResponseHeaders(db,res,insertId);
    logResponseCookies(db,res,insertId);
}

/**
 * Save reponse cookies into database
 * @param {*} db 
 * @param {*} res 
 * @param {Int} insertId  
 */
const logResponseCookies = (db,res,insertId) => {
    const headers = res.getHeaders();
    
    if(Object.keys(headers).length === 0 ){
        return;
    }

    const query = `
        INSERT INTO 
            http_cookies(
                request_id,
                name,
                value,
                is_response,
                http_only,
                secure,
                same_site_policy,
                expiration_timestamp,
                max_age
            )
        VALUES 
        (
            :request_id,
            :name,
            :value,
            1,
            :http_only,
            :secure,
            :same_site_policy,
            :expiration_timestamp,
            :max_age
        ) 
    `;

    const statement = db.prepare(query);

    Object.keys(headers).filter((key)=>key=='set-cookie').forEach( cookie_key => {
        const cookie_value = parseResponseCookie(headers[cookie_key]);

        if(cookie_value == {}) return;

        statement.run(
            {
                "name":cookie_value.name,
                "value":cookie_value.value,
                "http_only":cookie_value.httpOnly?1:0,
                "secure":cookie_value.secure?1:0,
                "same_site_policy":cookie_value.samesite_policy,
                "expiration_timestamp":cookie_value.expires,
                "max_age": cookie_value.max_age,
                "request_id":insertId
            });

    });
}

/**
 * save response headers into the database
 * @param {*} db 
 * @param {*} res 
 * @param {Int} insertId FK of the inserted request 
 */
const insertResponseHeaders = (db,res,insertId) => {
        
    const headers = res.getHeaders();
    
    if(Object.keys(headers).length === 0 ){
        return;
    }

    const header_query = `
        INSERT into http_headers (request_id,name,value,is_response) VALUES (
            :request_id,
            :name,
            :values,
            1
        );
    `
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
    transaction(headers);
};

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
        body = body.join();
        if(body){
            fs.writeFileSync(path_to_save,body);

            const bodyPathSql = `UPDATE requests SET raw_request_body_file=:path WHERE id = :id`
            const stmt = db.prepare(bodyPathSql);
            stmt.run({
                'id':insert_id,
                "path":path_to_save
            });

            const urlEncoded = checkEncodeURI(body);
            if(
                urlEncoded ||
                (typeof req.headers['content-type']!== 'undefined' && req.headers['content-type'] === 'multipart/formdata')
            ){

                const mime = urlEncoded?'application/x-www-form-urlencoded':req.headers['content-type'];
                update_request_detected_mime(mime,null);
                const bb = busboy({ headers: mime });

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
        }
   });
}

const request_log = (db,req,use_in_https,callback) => {
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
    var insertId = null;
    
    const transaction = db.transaction(() => {
 
        const insert_result = initialInsertStmt.run({
                "method":req.method,
                "domain":req.headers.host,
                "path": queryData.href,
                "path_without_params": queryData.pathname,
                "protocol":use_in_https?'https':'http',
                "request_mime":getReqMime(req)});
        
        var insertId = insert_result.lastInsertRowid;

        log_url_params(db,queryData.query,insertId);
        log_request_headers(db,req,insertId);
    });

    transaction();
    callback(null,insertId);
}

/**
 * Main Request Logger
 * @param {*} serviceLocator Database cionnection
 * @param {boolean} use_in_https true Socket is listening to Https otherwize Http is used
 * @returns connect.Server
 */
module.exports.log_request_and_response = (serviceLocator,use_in_https) => {
   
    const db = serviceLocator.get('db');
    const savePath = serviceLocator.get('config').http_data_save_path;

    const app = connect();

    app.use(function(req,res,next){
                
        request_log(db,req,use_in_https,(err,insert_id)=>{
            if(err){
               return next(err);
            }
            req.insertId=insert_id;
            next();
        });
    });

    app.use(cookieParser());
    app.use((req,res,next) => {

        if(req.cookies == null){
            return next();
        }

        if(typeof req.request_id == 'undefined'){
            return next();
        }

        const sql =`
            INSERT INTO http_cookies 
                (request_id,name,value,is_response)
            VALUES
                (:request_id,:name,:value,0);
        `;

        try {
            const stmt = db.prepare(sql);
            
            Object.keys(req.cookies).forEach((key)=>{
                stmt.run({
                    'request_id':req.request_id,
                    'name': key,
                    'value':req.cookies[key]
                });
            });
        } catch(e) {
            return next(e)
        }

        next();
    });

    app.use((req,res,next)=>{
        log_request_body(db,savePath,req,(err)=>{
            if(err) { return next(err)}
            next();
        })
    })

    app.use((req,res,next) => {
        
        if(typeof req.request_id == 'undefined'){
            return next();
        }

        res.on('finish', () => {
            try {
                updateResponse(db,res,req.request_id);
            } catch (e) {
                next(e);
            }
        });

        next();
    });

    return app;
}

