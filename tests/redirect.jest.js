const { assert } = require('node:console');
const http = require('node:http');
const request = require('supertest');

const db = require('../src/db.js');
const redirect = require('../src/manipulators/redirect');

describe("redirect to https", (done) => {
    const dbHandler = db(':memory:');
    dbHandler.exec(`
            INSERT INTO redirect (url_from,url_to,method,http_status_code,use_in_http,exact_match) VALUES
            ('http://google.com/mytest','http://yahoo.com','GET',301,1,1),
            ('http://google.com/mytest','http://yandex.com','GET',302,1,0)
        `,function(error){ done(error) });
    
    const server = http.createServer((req,res)=>{
        console.log("Call");
        redirect.redirectHttpToHttps(dbHandler,req,res)
    });
    
    const urls = [
        {
            'host':"google.com",
            'path':'mytest',
            'status':301,
            'location':'http://yahoo.com'
        },
        {
            'host':"google.com",
            'path':'mytest/123',
            'status':302,
            'location':'http://yandex.com'
        },
        {
            'host':"google.com",
            'path':'mytest/blahvlah',
            'status':302,
            'location':'http://yandex.com'
        },
        {
            'host':"google.com",
            'path':'mytest?val=123',
            'status':302,
            'location':'http://yandex.com'
        },
        {
            'host':"google.com",
            'path':'mytest/123?val=123',
            'status':302,
            'location':'http://yandex.com'
        },
    ];
    
    it.each(urls)(
        `redirects from $host/$path to $location using status $status`,
        (val)=>{
        request(server)
                .get(val.path)
                .set('Host',val.host)
                .then((res)=>{
                    try{
                        expect(res.headers["Location"].assertVal(val.location))
                        expect(res.status).toEqual(val.status);
                    }catch(e){
                        return done(e);
                    }
                });
        });
});