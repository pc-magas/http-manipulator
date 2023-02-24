const request = require('supertest');

const db = require('../src/common/db.js').createDb;
const redirect = require('../src/manipulators/redirect');

test("http only redirect from 'http://google.com/mytest to http://yahoo.com ", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect
                (url_from,url_to,method,http_status_code,use_in_http,exact_match) 
            VALUES
                ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
                ('http://google.com/mytest?param=hello','http://ikariam.gr','GET',301,1,1),
                ('http://google.com/mytest','http://yandex.com','GET',302,1,0)
        `,function(error){ done(error) });
    
    const server = redirect(dbHandler,false);
    
    request(server)
            .get('/mytest')
            .set('Host','google.com')
            .then((res)=>{

                expect(res.headers["location"]).toEqual('http://yahoo.com');
                expect(res.status).toEqual(301);
                done();
            });
            
});


test("http only redirect from 'http://google.com/mytest/lorem_ipsum to http://yandex.com ", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
            ('http://google.com/mytest?param=hello','http://ikariam.gr','GET',301,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,1,0)
        `);
    
    const server = redirect(dbHandler,false);

    
    const location="http://yandex.com"
    request(server)
            .get('/mytest/lorem_ipsum')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["location"]).toEqual(location);
                expect(res.status).toEqual(302);
                done();
            });
            
});


test("http only redirect from 'http://google.com/mytest/lorem_ipsum?param=hello to http://yandex.com ", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
            ('http://google.com/mytest?param=hello','http://ikariam.gr','GET',301,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,1,0)
        `,function(error){ done(error) });
    
    const server = redirect(dbHandler,false);

    const location="http://yandex.com"

    request(server)
            .get('/mytest/lorem_ipsum?param=hello')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["location"]).toEqual(location);
                expect(res.status).toEqual(302);
                done();
            });
            
});

test("http only redirect from 'http://google.com/mytest?param=hello to http://yandex.com (without exact match record)", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,1,0)
        `,function(error){ done(error) });
    
    const server = redirect(dbHandler,false);

    const location="http://yandex.com"

    request(server)
            .get('/mytest?param=hello')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["location"]).toEqual(location);
                expect(res.status).toEqual(302);
                done();
            });
            
});

test("http only redirect from 'http://google.com/mytest?param=hello to http://ikariam.gr (exact match) ", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
            ('http://google.com/mytest?param=hello','http://ikariam.gr','GET',301,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,1,0)
        `,function(error){ done(error) });
    
    const server = redirect(dbHandler,false);

    const location="http://ikariam.gr"

    request(server)
            .get('/mytest?param=hello')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["location"]).toEqual(location);
                expect(res.status).toEqual(301);
                done();
            });
            
});


test("Should not redirect because use_in_https is false", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
            ('http://google.com/mytest?param=hello','http://ikariam.gr','GET',301,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,1,0)
        `,function(error){ done(error) });
    
    const server = redirect(dbHandler,true);

    request(server)
            .get('/mytest')
            .set('Host','google.com')
            .then((res)=>{

                const headers = Object.keys(res.headers);
                expect(headers).not.toContain("Location");

                expect(res.status).not.toEqual(301);
                expect(res.status).not.toEqual(302);
                expect(res.status).not.toEqual(308);
                done();
            });
            
});

test("http to https redirect of same url",(done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com','https://google.com','GET',301,1,1)
        `,function(error){ done(error) });
    
    const server = redirect(dbHandler,false);

    const location="https://google.com"
    request(server)
            .get('/')
            .set('Host','google.com')
            .then((res)=>{

                expect(res.headers["location"]).toEqual(location);
                expect(res.status).toEqual(301);
                done();
            });
})


test("http to https redirect of same url with path (ignore path during redirect)",(done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com','https://google.com','GET',301,1,0)
        `,function(error){ done(error) });

    const server = redirect(dbHandler,false);

    const location="https://google.com/mytest"

    request(server)
            .get('/mytest')
            .set('Host','google.com')
            .then((res)=>{

                expect(res.headers["location"]).toEqual(location);
                expect(res.status).toEqual(301);
                done();
            });
})

test("https to http redirect of same url post",(done)=>{
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com','https://google.com','GET',301,1,0),
            ('http://google.com','https://google.com','POST',308,1,0),
            ('http://google.com','https://google.com','PUT',308,1,0),
            ('http://google.com','https://google.com','PATCH',308,1,0)

        `,function(error){ done(error) });
    
    const server = redirect(dbHandler,false);
    const location="https://google.com"

    request(server)
            .post('')
            .set('Host','google.com')
            .then((res)=>{

                expect(res.headers["location"]).toEqual(location);
                expect(res.status).toEqual(308);

                done();
            });
});

test("https to http redirect of same url post (using path)",(done)=>{
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com','https://google.com','GET',301,1,0),
            ('http://google.com','https://google.com','POST',308,1,0),
            ('http://google.com','https://google.com','PUT',308,1,0),
            ('http://google.com','https://google.com','PATCH',308,1,0)

        `,function(error){ done(error) });
    
    const server = redirect(dbHandler,false);
    const location="https://google.com/mytest"

    request(server)
            .post('/mytest')
            .set('Host','google.com')
            .then((res)=>{              
                expect(res.headers["location"]).toEqual(location);
                expect(res.status).toEqual(308);
                done();
            });
});

test("https to http redirect of same url post (using path and params)",(done)=>{
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com','https://google.com','GET',301,1,0),
            ('http://google.com','https://google.com','POST',308,1,0),
            ('http://google.com','https://google.com','PUT',308,1,0),
            ('http://google.com','https://google.com','PATCH',308,1,0)

        `,function(error){ done(error) });
    
    const server = redirect(dbHandler,false);

    const location="https://google.com/mytest?value=loremipsum"

    request(server)
            .post('/mytest?value=loremipsum')
            .set('Host','google.com')
            .then((res)=>{

              
                expect(res.headers["location"]).toEqual(location);
                expect(res.status).toEqual(308);
                done();
            });
});