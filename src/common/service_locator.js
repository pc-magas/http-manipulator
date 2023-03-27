const serviceLocator = require('servicelocator');

const configLoader = require('./common/config.js').loadConfigFromFile;
const db =  require('./common/db.js').createDb;


module.exports = (config_file)=>{
    const config = configLoader(config_file);
    
    const db_path = config.local_db;
    const database = db(db_path);

    serviceLocator.register('db',database);
    serviceLocator.register('config',config);

    return serviceLocator;
}