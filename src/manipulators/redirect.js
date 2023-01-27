const connect = require('connect');

module.exports = function(db, use_https=false){
    const app = connect();

    app.use(function(req,res,next){

        let url = req.headers.host+req.url;

        if(req.url == '/'){
            url = req.headers.host;
        }
    

        const where_http = use_https?" use_in_https = 1":" use_in_http = 1";
        let sql = `
            select 
                * 
            from 
                redirect 
            where 
                (
                    (:incomming_url = url_from and exact_match = 1)
                    or (instr(:incomming_url,url_from) <> 0 and exact_match = 0)
                )
                and "method" = :method 
                and ${where_http}
            order by exact_match desc, LENGTH(REPLACE(url_from,:incomming_url,'')) desc
            limit 1
        `;

        const stmt = db.prepare(sql);
        const row = stmt.get({'incomming_url':url,'method':req.method});

        if(typeof row == 'undefined'){
            next();
            return;
        }


        const url_sane = row.url_to.replace(/^(https?:|)\/\//,'');

        if(url_sane == req.headers.host){
            res.setHeader('Location', "https://"+url)
          
        } else {
            res.setHeader('Location', row.url_to)
        }

        res.writeHead(row.http_status_code);
        res.end();   
    });

    return app;
};