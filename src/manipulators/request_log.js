const { getReqMime } = require('../common/http_utils');

const connect = require('connect');
const { hrtime } = require('node:process');
const url = require('url');


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
        "status_code": res.status_code,
        "response_timestamp": hrtime.bigint(),
        'id': insertId
    });
        
    insertResponseHeaders(db,res,insertId);
}

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
        const value = params['param_name'];
        url_params_query.run({
            'request_id':request_id,
            'name':param_name,
            'value': value
        });
    });

};

module.exports.log_request = (db,use_in_https) =>{
   
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
            req.request_id = insertId;

            log_url_params(db,queryData.query,insertId);
            log_request_headers(db,req,insertId);

            res.on('finish', () => {
                try {
                    updateResponse(db,res,insertId);
                } catch (e) {
                    next(e);
                }
            });

            next();
        } catch(e) {
            next(e);
        }
    });

    return app;
}

