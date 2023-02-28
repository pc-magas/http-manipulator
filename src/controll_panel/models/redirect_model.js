const url = require('node:url');
const {http_methods,http_redirect} = require('../../constants.js');
const {sanitizeHttpMethods,isRedirectStatusCodeAcceptable, stringIsAValidUrl} = require('../../common/http_utils');
const {sqliteBoolVal} = require('../../common/db.js');

class InvalidInputArgumentError extends Error
{
    constructor(message) {
        super(message)
      }
}

class ActionDoesnotSupportStatusCode extends Error
{
    constructor(message) {
        super(message)
    }
}

class SaveNewValuesFailed extends Error
{
    constructor(msg,errors) {
        super(msg)
        this.errors = errors;
    }
}

module.exports = {
    InvalidInputArgumentError,
    ActionDoesnotSupportStatusCode,
    SaveNewValuesFailed
}

// eslint-disable-next-line jsdoc/require-returns
/**
 * 
 * Save the advanced settings for Http redirection
 * @todo redesighn this feature upon user feedback.
 * 
 * @param {*} db Db connection
 * @param {String} url_from Url where is received 
 * @param {String} url_to Url whjere will be redirected
 * @param {Array|String} methods Http methods
 * @param {int} status_code HttpStatus code 
 * @param {bool} use_in_http Handle In http
 * @param {bool} use_in_https Handle In https
 * @param {bool} exact_match Whether domain will be exaclty matched
 * 
 * @return {Object} Containing
 * {
 *   errors: [
 *      {
 *         params: {
 *            "url_from": string
 *            "url_to": string
 *            "method": string
 *            "status_code": int
 *            "use_in_http": 0|1,
 *            "use_in_https":0|1,
 *            "exact_match":0|1
 *         },
 *         "error_type":'db',
 *         "message": 'error_message'
 *      }
 *   ],
 *   duplicates: [
 *      {
 *            "url_from": string
 *            "url_to": string
 *            "method": string
 *            "status_code": int
 *            "use_in_http": 0|1,
 *            "use_in_https":0|1,
 *            "exact_match":0|1
 *      }
 *   ],
 *   saved_values: [
 *      {
 *            "url_from": string
 *            "url_to": string
 *            "method": string
 *            "status_code": int
 *            "use_in_http": 0|1,
 *            "use_in_https":0|1,
 *            "exact_match":0|1
 *      }
 *   ]
 * }
 */
function saveAdvancedRedirect(
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
        throw new InvalidInputArgumentError("use in http or use in https must be both true");
    }

    if(!stringIsAValidUrl(url_from)){
        throw new InvalidInputArgumentError("Url From is an invalid Url");
    }

    if(!stringIsAValidUrl(url_to)){
        throw new InvalidInputArgumentError("Invalid value for url_to");
    }

    status_code = parseInt(status_code);

    if(http_redirect.indexOf(status_code) < 0 ){
        throw new InvalidInputArgumentError("Invalid http Status code");
    }

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
            throw new ActionDoesnotSupportStatusCode(`${status_code} redirection is supported only for methods "PUT,POST,PATCH".`);
        }

        const stmt = db.prepare(sql);

        const errors = [];
        const saved_values = [];
        const duplicates = [];

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
                saved_values.push(params);
            } catch(e){
                if(e.code == 'SQLITE_CONSTRAINT_UNIQUE'){
                    duplicates.push(params);
                }
                console.log(e);
                errors.push({
                    "params":params,
                    "error_type":'db',
                    "msg":e.toString()
                });
            }
        });

        if (
            errors.length > 0 && saved_values.length == 0
        ) {
            throw new SaveNewValuesFailed('db_errors',errors);
        }

        return {
            errors,
            saved_values,
            duplicates
        };

    } else {
        throw InvalidInputArgumentError("No methods provided");
    }
    
}

// eslint-disable-next-line jsdoc/require-returns
/**
 * 
 * Save redirection setting for redirection from http to https.
 * 
 * @param {better_sql} db 
 * @param {String} domain url that will be redirected into https 
 * @param {String|Array} methods Http methods 
 * @param {String|int} status_code Http Status Code 
 * 
 * @return object
 */
module.exports.saveRedirectHttps = function(db,domain,methods,status_code){
    var url_to_insert = url.parse(domain);
    url_to_insert = url_to_insert.host;

    if(url_to_insert == null){
        throw new InvalidInputArgumentError("Url is invalid");
    }

    return saveAdvancedRedirect(db,'http://'+url_to_insert,'https://'+url_to_insert,methods,status_code,true,false,false);
};

module.exports.saveAdvancedRedirect = saveAdvancedRedirect;