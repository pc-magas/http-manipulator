const {no_301_302_http_methods} = require('../constants.js');

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
 * @returns {Bool} 
 */
const isRedirectStatusCodeAcceptable = (methods,status_code) => {
    status_code = parseInt(status_code);

    return no_301_302_http_methods.reduce((acc,value)=> acc||methods.indexOf(value) != -1,false) && [301,302].indexOf(status_code) != -1;
}

const stringIsAValidUrl = (s) => {
    try {
      new URL(s);
      return true;
    } catch (err) {
      return false;
    }
};

const getReqMime = (req)=>{
    console.log(req);
    return req.headers['Content-Type']??req.headers['content-type']??"uknown";
}

module.exports = {
    getProtocol,
    getBaseUrl,
    sanitizeHttpMethods,
    isRedirectStatusCodeAcceptable,
    stringIsAValidUrl,
    getReqMime
};