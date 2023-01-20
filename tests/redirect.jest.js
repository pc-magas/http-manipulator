const { assert } = require('node:console');
const http = require('node:http');
const request = require('supertest');

const db = require('../src/db.js');
const redirect = require('../src/manipulators/redirect');

test("http only redirect from 'http://google.com/mytest to http://yahoo.com ", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
            ('http://google.com/mytest?param=hello','http://ikariam.gr','GET',301,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,1,0)
        `,function(error){ done(error) });
    
    const server = http.createServer((req,res)=>{
        console.log("Call");
        redirect.redirectHttpToHttps(dbHandler,true,req,res)
    });
    
    request(server)
            .get('/mytest')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["Location"]).toEqual('http://yahoo.com');
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
        `,function(error){ done(error) });
    
    const server = http.createServer((req,res)=>{
        console.log("Call");
        redirect.redirectHttpToHttps(dbHandler,true,req,res)
    });
    
    const location="http://yandex.com"
    request(server)
            .get('/mytest/lorem_ipsum')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["Location"]).toEqual(location);
                expect(res.status).toEqual(301);
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
    
    const server = http.createServer((req,res)=>{
        console.log("Call");
        redirect.redirectHttpToHttps(dbHandler,true,req,res)
    });

    const location="http://yandex.com"

    request(server)
            .get('/mytest/lorem_ipsum?param=hello')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["Location"]).toEqual(location);
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
    
    const server = http.createServer((req,res)=>{
        console.log("Call");
        redirect.redirectHttpToHttps(dbHandler,true,req,res)
    });

    const location="http://yandex.com"

    request(server)
            .get('/mytest?param=hello')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["Location"]).toEqual(location);
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
    
    const server = http.createServer((req,res)=>{
        console.log("Call");
        redirect.redirectHttpToHttps(dbHandler,true,req,res)
    });
    
    const location="http://ikariam.gr"

    request(server)
            .get('/mytest?param=hello')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["Location"]).toEqual(location);
                expect(res.status).toEqual(302);
                done();
            });
            
});


test("Should not redirect because use_in_http is false", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
            ('http://google.com/mytest?param=hello','http://ikariam.gr','GET',301,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,1,0)
        `,function(error){ done(error) });
    
    const server = http.createServer((req,res)=>{
        console.log("Call");
        redirect.redirectHttpToHttps(dbHandler,false,req,res)
    });
    
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

test("http only redirect from 'http://google.com/mytest to http://yahoo.com (in https) ", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,use_in_https,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,0,1,1),
            ('http://google.com/mytest?param=hello','http://ikariam.gr','GET',301,0,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,0,1,0)
        `,function(error){ done(error) });
    
    const server = http.createServer((req,res)=>{
        console.log("Call");
        redirect.redirectHttpToHttps(dbHandler,true,req,res)
    });
    
    request(server)
            .get('/mytest')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["Location"]).toEqual('http://yahoo.com');
                expect(res.status).toEqual(301);
                done();
            });
            
});

test("http only redirect from 'http://google.com/mytest to http://yahoo.com (in https and http) ", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,use_in_https,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1,1),
            ('http://google.com/mytest?param=hello','http://ikariam.gr','GET',301,0,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,0,1,0)
        `,function(error){ done(error) });
    
    const server = http.createServer((req,res)=>{
        console.log("Call");
        redirect.redirectHttpToHttps(dbHandler,true,req,res)
    });
    
    request(server)
            .get('/mytest')
            .set('Host','google.com')
            .then((res)=>{
                expect(res.headers["Location"]).toEqual('http://yahoo.com');
                expect(res.status).toEqual(301);
                done();
            });
            
});