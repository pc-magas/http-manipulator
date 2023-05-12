const {no_301_302_http_methods} = require('../constants.js');

const mmm = require('mmmagic');
const mime = require('mime-types');
const {Buffer} = require("node:buffer");

const getProtocol = (req) => {
    if(req.protocol) return req.protocol;
    
    return req.secure ? 'https':'http';
};

const getBaseUrl = (req) => {
    return `${getProtocol(req)}://${req.headers.host}`
}

/**
 * Creates a unique array containing all http methods
 * @param {String|Array}  methods 
 * @returns {Array}
 */
const sanitizeHttpMethods = (methods) => {

    if( (typeof methods == 'string' || methods instanceof String) && methods.trim() != ""){
        methods=[methods];
    } 

    if (Array.isArray(methods) && methods.length > 0){

        let uniquemethods = new Map(methods.map(s => [s.trim().toUpperCase(), s]));
        return [...uniquemethods.values()].map(method => method.trim().toUpperCase());
    }

    return methods;
}

/**
 * 
 * POST PUT PATCH will accept 307 and 308 status codes.
 *  
 * @param {Array} methods 
 * @param {Int|String} status_code
 * 
 * @returns {boolean} 
 */
const isRedirectStatusCodeAcceptable = (methods,status_code) => {
    status_code = parseInt(status_code);

    return no_301_302_http_methods.reduce((acc,value)=> acc||methods.indexOf(value) != -1,false) && [301,302].indexOf(status_code) != -1;
}

/**
 * Validate whether a value s is a string
 * @param {*} s The incomming value that needs to be validated as URL 
 * @returns {boolean}
 */
const stringIsAValidUrl = (s) => {
    try {
      new URL(s);
      return true;
    } catch (err) {
      return false;
    }
};

/**
 * Get request mime type
 * @param {*} req Http request 
 * @returns 
 */
const getReqMime = (req)=>{
    return req.headers['Content-Type']??req.headers['content-type']??"uknown";
}

/**
 * Parses Response Cookies.
 * 
 * @param {String} cookie 
 * @returns {Object}
 * 
 */
const parseResponseCookie = (cookie) => {
    
    if(typeof cookie != "string") return {};
    
    cookie = cookie.trim();

    if(!cookie) return {};

    const cookieExplode = (cookie.split(';')).map((value)=>value.trim()).filter(value=>value!="");

    return cookieExplode.reduce((acc,value) => {
        value = value.split('=').map((exploded_value)=>exploded_value.trim());
        
        const key = value.shift();
        // we do not care if undefined. Some cases will use it
        const cookie_value = value.shift();

        switch(key){
            case 'HttpOnly':
                acc.httpOnly = true;
                break;
            case 'Secure':
                acc.secure = true;
                break;
            case 'Partitioned':
                acc.partitioned = true;
                break;
            case 'Max-Age':
                acc["max-age"]=cookie_value;
                break;
            case 'SameSite':
                acc.samesite_policy = cookie_value;
                break;
            case 'Expires':
                acc.expires = cookie_value;
                break;
            case 'Domain':
                acc.domain = cookie_value;
                break
            case 'Path':
                acc.path = cookie_value;
                break;
            default:
                acc.name=key;
                acc.value=cookie_value;
        }

        return acc;
    },{
        'httpOnly':false,
        'samesite_policy':'Lax',
        'secure': false,
        'expires':null,
        'partitioned': false,
        'max-age':null
    });
}

/**
 * Check whether str is base64 encoded or not
 * @param {String} str 
 * @returns {Boolean} 
 */
const isBase64 = (str) => {
    const base64RegExp = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
    const cleanedStr = str.replace(/[\n\r\s]+/g, '');
    return base64RegExp.test(cleanedStr);
};

/**
 * Check if valis url encoded.
 * For now I set the value as true
 * @param {String} body 
 * @returns {Boolean}
 */
const isValidFormUrlEncoded = (body) => {
    return /^(?:(?:\w+)(?:\[(?:\d*|'[^']*')\])?=[\w%]*(?:&|$))*$/.test(body);
}

/**
 * Detects mime type and file extention from request body
 * @param {String} body request Body 
 * @param {Function} callback (err,mime,extention,dataBuffer)  
 */
const detectBodyMime = (body,callback) => {
    let buffer = isBase64(body)?Buffer.from(body,'base64'):Buffer.from(body);
  
    const magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);

    magic.detect(buffer, function(err, result) {
        
        if (err) {  return callback(err); }

        if(result == 'text/plain') {
            try {
                let text = buffer.toString();
                if (text.codePointAt(0) === 0xFEFF) { // UTF8 BOM
                    text = text.substring(1);
                }
                JSON.parse(text);
                return callback(null,'application/json','json',buffer);
            }catch(e){                
                // Do nothing keep it silent we need to just verify that content is Json
            }
            
            if(isValidFormUrlEncoded(buffer)){
                return callback(null,'application/x-www-form-urlencoded',null,buffer);
            }

            
        }
        
        return callback(null,result,mime.extension(result),buffer);
    });
}

/**
 * https://stackoverflow.com/a/48394500
 * @param {String} str 
 * @returns Boolean
 */
const checkEncodeURI = (str) => {
    return /^((.*)=(.*)\&(.*)=(.*)\&?)+$/.test(str) || /^(.*)=(.*)$/.test(str);
}

module.exports = {
    getProtocol,
    getBaseUrl,
    sanitizeHttpMethods,
    isRedirectStatusCodeAcceptable,
    stringIsAValidUrl,
    getReqMime,
    parseResponseCookie,
    detectBodyMime,
    checkEncodeURI
};