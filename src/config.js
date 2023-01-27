const fs = require('fs');
const path = require('path');
/**
 * Load config. Keep in mind it is a syncronous function.
 * @param {String} config_path Path where config file exists
 * @returns {Object} with parsed Json 
 */
function loadConfig(config_path) {
    
    const path_cwd = path.normalize(path.join(process.cwd(),config_path));
    
    //@todo make it simpler
    if(
        !fs.existsSync(config_path) && !fs.existsSync('/etc/http_manipulator/config.json') && !fs.existsSync(path_cwd)
    ){
        console.error(`Configuration file does not exist ar path ${config_path}`);
        process.exit(-1);
    } else if(!fs.existsSync(config_path) && !fs.existsSync(path_cwd) && fs.existsSync('/etc/http_manipulator/config.json')){
        config_path='/etc/http_manipulator/config.json';
    } else if(!fs.existsSync(config_path) && fs.existsSync(path_cwd)) {
        config_path = path_cwd;
    }

    const json=JSON.parse(fs.readFileSync(config_path));

    // Loading defaults
    json.local_db=json.local_db||'/etc/http_manipulator/db.sqlite'
    json.ssl_path=json.ssl_path||"/etc/http_manipulator/ssl/"

    return json;
}

module.exports = loadConfig;