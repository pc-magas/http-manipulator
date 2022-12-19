module.exports.redirectToHttps = (db,http_only,req,res)=>{

    if(res.writableEnded){
        return;
    }

    const method = req.method.trim().toLowerCase();
    const fullUrl = req.get('host') + req.originalUrl;
    const url_host_only = req.get('host');
   
    const sql = "SELECT * from redirect where use_in_http = 1 and exact_match = 1 and url_from = ? and exact_match=1 LIMIT 1";
    db.serialize(function() {
        const stmt = db.prepare(sql);
        const value = stmt.run(fullUrl)
        stmt.finalize();
        
    });
}