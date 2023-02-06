const url = require('node:url');
const {http_methods,no_301_301_http_methods} = require('../../constants.js');
const difference = require('lodash.difference');

/**
 * 
 * Save redirection setting for redirection from http to https.
 * 
 * @param {better_sql} db 
 * @param {String} domain url that will be redirected into https 
 * @param {String|Array} methods Http methods 
 * @param {String|int} status_code Http Status Code 
 */
module.exports.saveRedirectHttps = function(db,domain,methods,status_code){

    var url_to_insert = url.parse(domain);
    url_to_insert = url_to_insert.host;
    status_code = parseInt(status_code);

    const sql = `INSERT INTO redirect (
            url_from,
            url_to,
            method,
            http_status_code,
            use_in_http,
            use_in_https,
            exact_match
        ) values (
            :domain,
            :domain,
            :method,
            :status_code,
            1,
            0,
            0
        )`;

    
    if( (typeof methods == 'string' || methods instanceof String) && methods.trim() != ""){
        methods=[methods];
    } 


    if (Array.isArray(methods) && methods.length > 0){

        let uniquemethods = new Map(methods.map(s => [s.trim().toUpperCase(), s]));
        uniquemethods = [...uniquemethods.values()];

        
        if(no_301_301_http_methods.reduce((acc,value)=> acc||uniquemethods.indexOf(value) != -1,false) && [301,302].indexOf(status_code) != -1){
            throw Error(`${status_code} redirection is supported only for methods "PUT,POST,PATCH".`);
        }

        const stmt = db.prepare(sql);
        
        uniquemethods.forEach((value)=>{
                        
            if(http_methods.indexOf(value) == -1){
                throw Error(`Http does not support method ${value}`);
            }
            
            stmt.run({
                "domain": url_to_insert,
                "method": value,
                "status_code" : status_code
            });
        });
    } else {
        throw Error("No methods provided");
    }
};