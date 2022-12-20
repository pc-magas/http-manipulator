/**
 * NOTE a seeder must not be named all.
 */
const seeders = {
    "redirect_http":function(database){
        // eithwet http or https at url_from is truncated via a trigger 
        database.run(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
            ('http://google.com/mytest2','http://yandex.com','GET',302,1,0)
            ('http://google.com?q=ikariam','http://yandex.com','GET',302,1,1)
            ('http://example.com/products','https://fakestoreapi.com/products','POST',308,1,1),
            ('http://example.net/products','https://fakestoreapi.com/products','POST',308,1,0),
            ('http://example.net','https://fakestoreapi.com/products','POST',308,1,0),
        `);
    }
}

module.exports=seeders;