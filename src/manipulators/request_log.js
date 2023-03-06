const connect = require('connect');
const { getReqMime } = require('../common/http_utils');

module.exports.log_request = (db,use_in_https) =>{
    const log_module = connect();
    
    log_module.use(function(req,res,next){
        
        const initialInsert = `
            INSERT INTO requests (
                method,
                domain,
                protocol,
                path,
                request_mime
            ) VALUES (
                :method,
                :domain,
                :protocol,
                :path,
                :request_mime
            ) RETURNING id;
        `;
        
        const initialInsertStmt  = db.prepare(initialInsert);
        try{

            const insert_result = initialInsertStmt.run({
                "method":req.method,
                "domain":req.headers.host,
                "path":req.url,
                "protocol":use_in_https?'https':'http',
                "request_mime":getReqMime(req)
            });
            req.request_id = insert_result.lastInsertRowid;
            next();
        } catch(e){
            next(e);
        }
    });

    return log_module;
}