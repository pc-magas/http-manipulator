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