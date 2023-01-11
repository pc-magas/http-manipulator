module.exports.redirectHttpToHttps = (db,req,res)=>{

    if(res.writableEnded){
        return;
    }

    // const method = req.method.trim().toLowerCase();
    // const fullUrl = req.get('host') + req.originalUrl;
    // const url_host_only = req.get('host');
   
    // const sql = "SELECT * from redirect where use_in_http = 1 and exact_match = 1 and url_from = ? and exact_match=1 LIMIT 1";
    // const sqlNonExact = "SELECT * from redirect where use_in_http = 1 and exact_match = 1 and url_from = ? and exact_match=1 LIMIT 1"

    // db.all(sql,fullUrl,function(err, rows) {
    //     if(err){
    //         console.error(err)
    //     }
    //     console.log(rows);
    // });
    console.log("Here");
    res.writeHead(301, {
        location: "https://google.com",
      });
    res.end();
  
}