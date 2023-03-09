const request = require('supertest');

const {createDb} = require('../../src/common/db.js');
const log_request = require('../../src/manipulators/request_log').log_request;

/**
 * Cannot test response headers despite they work at:
 * stackoverflow/connect_expirement.js
 */
test('HTTP GET logs data', (done) => {

    const db = createDb(':memory:');

    const app = log_request(db,false);
    
    app.use((err,req,res,next)=>{
        expect(req.request_id).toBeDefined();      

        if(err){
            done(err);
        }

        console.log("Here");

        try {
            var result = db.prepare('SELECT * from requests where id = :id').all({"id":req.request_id});
        }catch(e){
            done(e);
        }

        expect(result.length).toEqual(1);
        result = result.pop();
            
        expect(result.domain).toEqual('example.com');
        expect(result.protocol).toEqual('http');
        expect(result.method).toEqual('GET');

        expect(result.status_code).toEqual(200);

        try {
            var result = db.prepare('SELECT count(*) as count from requests where id = :id').get({"id":req.request_id});
            result = result.pop();
            expect(result).toBeGreaterThan(0);
        }catch(e){
            done(e);
        }


        try {
            var result = db.prepare(`SELECT count(*) as count from requests where id = :id and name=host and value <> 'example.com'`).get({"id":req.request_id});
            result = result.pop();
            expect(result.length).toEqual(0);
        }catch(e){
            done(e);
        }

        try {
            var result = db.prepare(`SELECT value as count from requests where id = :id and name='x-myheader' `).get({"id":req.request_id});
            result = result.pop();
            expect(parseInt(result.value)).toEqual(3);
        }catch(e){
            done(e);
        }

        next();
    });

    app.use((req,res,next)=>{
        res.writeHead(200,{
            'content_type':'application/text',
            'x-val': 3
        }); 
        res.end(""+req.request_id);
        next();
    });

    request(app)
        .get('/mytest')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .then((res)=>{
            done();
        });
});

