const url = require('node:url');
const {http_methods} = require('../../constants.js');
const {sanitizeHttpMethods,isRedirectStatusCodeAcceptable} = require('../../common/http_utils');
const {sqliteBoolVal} = require('../../common/db.js');

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
 
    const uniquemethods = sanitizeHttpMethods(methods);

    if (Array.isArray(uniquemethods) && uniquemethods.length > 0){
        
        if(isRedirectStatusCodeAcceptable(uniquemethods,status_code)){
            throw Error(`${status_code} redirection is supported only for methods "PUT,POST,PATCH".`);
        }

        const stmt = db.prepare(sql);
        
        const errors = [];

        uniquemethods.forEach((value)=>{
                        
            if(http_methods.indexOf(value) == -1){
                errors.push(`Http does not support method ${value}`);
                return;
            }
            
            stmt.run({
                "domain": url_to_insert,
                "method": value,
                "status_code" : status_code
            });
        });

        if (errors.length > 0) {
            throw new Error(errors.join());
        }

    } else {
        throw Error("No methods provided");
    }
};

/**
 * 
 * Save the advanced settings for Http redirection
 * @todo redesighn this feature.
 * 
 * @param {*} db Db connection
 * @param {String} url_from Url where is received 
 * @param {String} url_to Url whjere will be redirected
 * @param {Array|String} methods Http methods
 * @param {int} status_code HttpStatus code 
 * @param {bool} use_in_http Handle In http
 * @param {bool} use_in_https Handle In https
 * @param {bool} exact_match Whether domain will be exaclty matched
 */
module.exports.saveAdvancedRedirect=function(
    db,
    url_from,
    url_to,
    methods,
    status_code,
    use_in_http,
    use_in_https,
    exact_match
){

    use_in_http = typeof use_in_http == 'undefined'?true:use_in_http;
    use_in_https = typeof use_in_https == 'undefined'?false:use_in_https;
    exact_match = typeof exact_match == 'undefined'?false:exact_match;

    if(use_in_http == false && use_in_https == false){
        throw Error("use in http or use in https must be both true");
    }

    status_code = parseInt(status_code);

    methods = sanitizeHttpMethods(methods);


    const sql = `INSERT INTO redirect (
        url_from,
        url_to,
        method,
        http_status_code,
        use_in_http,
        use_in_https,
        exact_match
    ) values (
        :url_from,
        :url_to,
        :method,
        :status_code,
        :use_in_http,
        :use_in_https,
        :exact_match
    )`;

    const uniquemethods = sanitizeHttpMethods(methods);
    if (Array.isArray(uniquemethods) && uniquemethods.length > 0){
        
        if(isRedirectStatusCodeAcceptable(uniquemethods,status_code)){
            throw Error(`${status_code} redirection is supported only for methods "PUT,POST,PATCH".`);
        }

        const stmt = db.prepare(sql);

        const errors = [];

        uniquemethods.forEach((value)=>{
                        
            if(http_methods.indexOf(value) == -1){
                errors.push(`Http does not support method ${value}`);
                return;
            }

            const params = {
                "url_from": url_from.trim(),
                "url_to":url_to.trim(),
                "method": value,
                "status_code" : status_code,
                "use_in_http":sqliteBoolVal(use_in_http),
                "use_in_https":sqliteBoolVal(use_in_https),
                "exact_match":sqliteBoolVal(exact_match)
            };
            try {
                stmt.run(params);
            } catch(e){
                errors.push(e.toSting());
            }
        });

        if (errors.length > 0) {
            throw new Error(errors.join());
        }

    } else {
        throw Error("No methods provided");
    }
    
}