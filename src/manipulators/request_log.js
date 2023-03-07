const connect = require('connect');
const { getReqMime } = require('../common/http_utils');
const { hrtime } = require('node:process');

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
        }
    );

    insertResponseHeaders(db,res,insertId);
}

const insertResponseHeaders = (db,res,insertId) => {
     
    const header_query = `
        INSERT into http_headers values (request_id,name,value,is_response) VALUES (
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
        for (const {name,value} of headers){
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
        }
    });

    transaction(res.getHeaders());
};


module.exports.log_request = (db,use_in_https) =>{
    const log_module = connect();
    
    log_module.use(function(req,res,next){
        
        const initialInsert = `
            INSERT INTO requests (
                method,
                domain,
                protocol,
                path,
                request_mime,
                request_timestamp_unix_nanosecond
            ) VALUES (
                :method,
                :domain,
                :protocol,
                :path,
                :request_mime,
                :insert_time
            ) RETURNING id;
        `;
        
        const initialInsertStmt  = db.prepare(initialInsert);
        try{

            const insert_result = initialInsertStmt.run({
                "method":req.method,
                "domain":req.headers.host,
                "path":req.url,
                "protocol":use_in_https?'https':'http',
                "request_mime":getReqMime(req),
                'insert_time': hrtime.bigint()
            });

            var insertId = insert_result.lastInsertRowid;
            req.request_id = insertId;

            res.on('finish', () => {
                try{
                    updateResponse(db,res,insertId);
                } catch (e) {
                    next(e);
                }
            });

            next();
        } catch(e){
            next(e);
        }
    });



    return log_module;
}

