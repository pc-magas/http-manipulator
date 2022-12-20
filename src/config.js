const fs = require('fs');

/**
 * Load config. Keep in mind it is a syncronous function.
 * @param {String} path Path where config file exists
 * @returns {Object} with parsed Json 
 */
function loadConfig(path) {
    if(!fs.existsSync(path) && !fs.existsSync('/etc/http_manipulator/config.json')){
        console.error(`Configuration file does not exist ar path ${path}`);
        exit(-1);
    } else if(!fs.existsSync(path) && fs.existsSync('/etc/http_manipulator/config.json')){
        path='/etc/http_manipulator/config.json';
    }

    const json=JSON.parse(fs.readFileSync(path));

    // Loading defaults
    json.local_db=json.local_db||'/etc/http_manipulator/db.sqlite'
    json.ssl_path=json.ssl_path||"/etc/http_manipulator/ssl/"

    return json;
}

module.exports = loadConfig;