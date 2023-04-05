const connect = require('connect');
const cookieParser = require('cookie-parser');

const updateResponse = require('./log_response_model');
const request_log = require('./log_request_model');

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

