const fs = require('fs');

/**
 * Load config. Keep in mind it is a syncronous function.
 * @param {String} path Path where config file exists
 * @returns {Object} with parsed Json 
 */
function loadConfig(path) {
    if(!fs.existsSync(path)){
        console.error(`Configuration file does not exist ar path ${path}`);
        exit(-1);
    }

    return JSON.parse(fs.readFileSync(path));
}

module.exports = loadConfig;