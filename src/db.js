const sqlite3 = require('sqlite3');
function createTables(db){

    const sql = `
        CREATE TABLE IF NOT EXISTS certs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain  TEXT not null,
            cert_path TEXT not null,
            key_path TEXT not null,
            ca_path TEXT null
        );

        CREATE table IF NOT EXISTS redirect (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url_from TEXT not null,
            url_to TEXT not null,
            method TEXT not null,
            http_status_code INTEGER not null CHECK( http_status_code IN (300,301,302,304,304,308,307) ) DEFAULT 301,
            use_in_https  INTEGER not null CHECK(use_in_https IN (0,1)) DEFAULT 0,
            use_in_http  INTEGER not null CHECK(use_in_http IN (0,1)) DEFAULT 1,
            exact_match INTEGER not null CHECK(exact_match IN (0,1)) DEFAULT 1
        );
        
        CREATE TRIGGER remove_http_https AFTER INSERT ON redirect
        BEGIN
            UPDATE redirect 
            SET url_from = REPLACE(REPLACE(NEW.url_from,'http://',''),'https://','') 
            WHERE rowid=NEW.rowid;
        END;

        CREATE TRIGGER remove_http_https_update AFTER UPDATE ON redirect
        BEGIN
            UPDATE redirect 
            SET url_from = REPLACE(REPLACE(NEW.url_from,'http://',''),'https://','') 
            WHERE rowid=NEW.rowid;
        END;

        create table IF NOT EXTSTS reverse_proxy_forward (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from TEXT not null,
            from_is_ip INTEGER not null CHECK(pType IN (0,1)) DEFAULT 1,
            to TEXT not null,
            to_is_ip INTEGER not null CHECK(pType IN (0,1)) DEFAULT 1,
            cloaked_domain TEXT null
        )
    `
    db.exec(sql);
}

module.exports = function(db_path){
    const db = new sqlite3.Database(db_path,sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,(err) => {
        if (err) {
            console.log("Getting error " + err);
            exit(1);
        }

        createTables(db);
    });

    return db;
} 