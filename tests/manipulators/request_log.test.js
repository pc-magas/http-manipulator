const request = require('supertest');

const {createDb} = require('../../src/common/db.js');
const log_request = require('../../src/manipulators/request_log').log_request;

test('HTTP GET logs data',(done)=>{

    const db = createDb(':memory:');

    const app = log_request(db,false);
    
    app.use((req,res,next)=>{
        console.log(req.request_id);
        expect(req.request_id).toBeDefined();

        try {

            let result = db.prepare('SELECT * from requests where id = :id').all({"id":req.request_id});
            
            console.log(result);
            expect(result.length).toEqual(1);
            result = result.pop();
            
            expect(result.domain).toEqual('example.com');
            expect(result.protocol,'https');
            expect(result.method,'GET');
            
            done();
        }catch(e){
            done(e);
        }

        res.writeHead(200);
        res.end("".req.request_id);
    });

    request(app)
            .get('/mytest')
            .set('Host','example.com')
            .then((res)=>{           
            });
       
})