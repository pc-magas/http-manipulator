const { getReqMime,parseResponseCookie } = require('../common/http_utils');

const connect = require('connect');
const { hrtime } = require('node:process');
const url = require('url');
const cookieParser = require('cookie-parser');

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

    const updateContentTypeQuery = `
        UPDATE requests SET 
            response_mime = :response_mime
        WHERE 
            id = :id
    `

    const updateResponseMimeType = db.prepare(updateContentTypeQuery);

    const transaction =  db.transaction((headers) => {
        
        Object.keys(headers).forEach( name => {
            const value = headers[name];

            headerInsert.run({
                "name": name,
                "value":value,
                "request_id": insertId
            });

            if(name.toLowerCase() == 'content-type'){
                updateResponseMimeType.run({
                    "response_mime": value,
                    'id': insertId
                });
            }
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

/**
 * Main Request Logger
 * @param {*} db Database cionnection
 * @param {boolean} use_in_https true Socket is listening to Https otherwize Http is used
 * @returns connect.Server
 */
module.exports.log_request = (db,use_in_https) => {
   
    const app = connect();

    app.use(function(req,res,next){
        
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
        
        const initialInsertStmt  = db.prepare(initialInsert);
        try {

            const queryData = url.parse(req.url, true);

            const insert_result = initialInsertStmt.run({
                "method":req.method,
                "domain":req.headers.host,
                "path": queryData.href,
                "path_without_params": queryData.pathname,
                "protocol":use_in_https?'https':'http',
                "request_mime":getReqMime(req),
                'insert_time': hrtime.bigint()
            });

            var insertId = insert_result.lastInsertRowid;
            req.request_id = parseInt(insertId);

            log_url_params(db,queryData.query,insertId);
            log_request_headers(db,req,insertId);

            next();
        } catch(e) {
            next(e);
        }
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

