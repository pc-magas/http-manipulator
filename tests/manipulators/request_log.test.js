const request = require('supertest');

const {createDb} = require('../../src/common/db.js');
const log_request = require('../../src/manipulators/request_log').log_request;

test('HTTP GET logs data',(done)=>{

    const db = createDb(':memory:');

    const app = log_request(db,false);
    
    app.use((err,req,res,next)=>{
        expect(req.request_id).toBeDefined();      

        if(err){
            done(err);
        }

        res.on('finish', () => {
            
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

            expect(result.response_mime).toEqual('application/text');

            done();
        });

        next();
    });

    app.use((req,res)=>{
        res.writeHead(200,{
            'content_type':'application/text',
            'x-val': 3
        }); 
        res.end(""+req.request_id);
    });

    request(app)
        .get('/mytest')
        .set('Host','example.com')
        .then((res)=>{});
})