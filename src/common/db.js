const sqlite3 = require('better-sqlite3');
const {http_status_code_as_string} = require('../constants');

/**
 * @param {sqlite3} db 
 */
function createTables(db){
    const createTablesInTransaction = db.transaction(function(){
        const sql = `

            CREATE TABLE IF NOT EXISTS certs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                domain  TEXT not null,
                cert_path TEXT not null,
                key_path TEXT not null,
                ca_path TEXT null
            );

            CREATE TABLE IF NOT EXISTS requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                method TEXT not null,
                domain TEXT not null,
                path TEXT not null,
                path_without_params not null,
                protocol TEXT not null CHECK( protocol IN ('http','https')),
                response_status_code INTEGER CHECK( response_status_code IN (${http_status_code_as_string}) ),
                request_type TEXT,
                request_mime TEXT,
                response_mime TEXT,
                request_raw TEXT,
                response_raw TEXT,
                request_body TEXT,
                response_body TEXT,
                request_length_bytes INTEGER,
                response_length_bytes INTEGER,
                manupulated INTEGER CHECK(manupulated IN (0,1)) DEFAULT 0,
                redirected_to TEXT,             
                request_timestamp_unix_nanosecond INTEGER,
                response_timestamp_unix_nanosecond datetime
            );

            CREATE TABLE IF NOT EXISTS http_headers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT not null,
                value TEXT not null,
                request_id INTEGER,
                is_response INTEGER CHECK(is_response IN (0,1)) DEFAULT 0,
                FOREIGN KEY(request_id) REFERENCES requests(id)
            );

            CREATE TABLE IF NOT EXISTS request_http_params (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                request_id INTEGER,
                param_location INTEGER CHECK(param_location IN ('BODY','URL','COOKIE')),
                name TEXT,
                value TEXT,
                value_in_file INTEGER CHECK(value_in_file IN (0,1)),
                FOREIGN KEY(request_id) REFERENCES requests(id)
            );


            CREATE table IF NOT EXISTS redirect (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url_from TEXT not null,
                url_to TEXT not null,
                method TEXT not null,
                http_status_code INTEGER not null CHECK( http_status_code IN (301,302,303,304,305,306,307,308) ) DEFAULT 301,
                use_in_https  INTEGER not null CHECK(use_in_https IN (0,1)) DEFAULT 0,
                use_in_http  INTEGER not null CHECK(use_in_http IN (0,1)) DEFAULT 1,
                exact_match INTEGER not null CHECK(exact_match IN (0,1)) DEFAULT 1,
                UNIQUE(url_from,method,http_status_code,use_in_http,exact_match),
                UNIQUE(url_from,method,http_status_code,use_in_https,exact_match)
                CHECK(use_in_http=1 or use_in_https=1)
            );
            
            DROP TRIGGER IF EXISTS remove_http_https;
            CREATE TRIGGER remove_http_https AFTER INSERT ON redirect
            BEGIN
                UPDATE redirect 
                SET url_from = REPLACE(REPLACE(NEW.url_from,'http://',''),'https://','') 
                WHERE rowid=NEW.rowid;
            END;

            DROP TRIGGER IF EXISTS remove_http_https_update;
            CREATE TRIGGER remove_http_https_update AFTER UPDATE ON redirect
            BEGIN
                UPDATE redirect 
                SET url_from = REPLACE(REPLACE(NEW.url_from,'http://',''),'https://','') 
                WHERE rowid=NEW.rowid;
            END;
        `;
        db.exec(sql);
    });
    createTablesInTransaction();
}

module.exports.createDb = function(db_path){
    const db = sqlite3(db_path);
    db.pragma('journal_mode = WAL');
    createTables(db);
    return db;
}

/**
 * Casts a value as sqlite-acceptable boolean value
 * @param {String|Integer|Boolean} val 
 * @returns {1|0}
 */
module.exports.sqliteBoolVal = (val) => {
    val = typeof val == 'string'? val.trim().toLowerCase():val;

   return  ['true','yes','y','on',1,true].indexOf(val) > 0?1:0;

}; 
