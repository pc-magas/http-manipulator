const mmm = require('mmmagic');
const mime = require('mime-types');
const yaml = require('js-yaml');

const {Buffer} = require("node:buffer");

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
    return /^(?:(?:\w+)(?:\[(?:\d*|'[^']*')\])*=[\w\-\+\.%]*(?:&|$))+$/.test(body);
}

const isMultipart = (body) => {
    const pattern = /[\-\w]+\r\nContent-Disposition:\sform-data;\sname=.*\r\n/;
    return pattern.test(body);
};

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
            let text = buffer.toString();
            if (text.codePointAt(0) === 0xFEFF) { // UTF8 BOM
                text = text.substring(1);
            }
            
            try {   
                JSON.parse(text);
                return callback(null,'application/json','json',buffer);
            }catch(e){                
                // Do nothing keep it silent we need to just verify that content is Json
            }

            if(isValidFormUrlEncoded(text)){
                return callback(null,'application/x-www-form-urlencoded',null,buffer);
            } 
            
            if(isMultipart(text)){
                return callback(null,'multipart/form-data',null,buffer);
            }

            try {
                yaml.load(text);
                return callback(null,'text/yaml','yml',buffer);
            } catch (e) {
                //
            }  
        } else if(result=='application/octet-stream'){
            let text = buffer.toString();

            if(isMultipart(text)){
                return callback(null,'multipart/form-data',null,buffer);
            }
        }
        
        return callback(null,result,mime.extension(result),buffer);
    });
}

module.exports = detectBodyMime;
