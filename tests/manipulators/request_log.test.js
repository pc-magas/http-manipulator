const request = require('supertest');
const connect = require('connect');

const {createDb} = require('../../src/common/db.js');
const log_request = require('../../src/manipulators/request_log').log_request_and_response;

/**
 * Cannot test response headers despite they work at:
 * stackoverflow/connect_expirement.js
 */
test('HTTP GET logs data', (done) => {


    const db = createDb(':memory:');

    const app = connect();
    app.use(log_request(db,false));
        
    app.use((req,res,next)=>{
        expect(req.request_id).toBeDefined();      

        try {
            let result = db.prepare('SELECT * from requests where id = :id').all({"id":req.request_id});
            expect(result.length).toEqual(1);
            result = result.pop();
                
            expect(result.domain).toEqual('example.com');
            expect(result.protocol).toEqual('http');
            expect(result.method).toEqual('GET');
            expect(result.response_body).toEqual(null);
        }catch(e){
           return done(e);
        }

        try {
            let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='host' and value <> 'example.com'`).get({"id":req.request_id});
            expect(result.count).toEqual(0);
        }catch(e){
           return done(e);
        }

        try {
            let result = db.prepare(`SELECT value from http_headers where request_id = :id and name='x-myheader' `).get({"id":req.request_id});
            expect(parseInt(result.value)).toEqual(3);
        }catch(e){
            return done(e);
        }

        try {
            let result = db.prepare(`SELECT * from request_http_params where request_id = :id `).all({"id":req.request_id});
            expect(parseInt(result.length)).toEqual(2);

            result.forEach((value)=>{
                expect(['param1','param2']).toContain(value.name);
                switch(value.name){
                    case 'param1':
                        expect(value.value).toBe('lorem_ipsum');
                        break;
                    case 'param2':
                        expect(value.value).toBe('Jack Sprarrows');
                        break;
                    default:
                        done(new Error("no defined values"));
                }

                expect(value.value_in_file).toBe(0);
            });

        } catch(e) {
          return done(e);
        }

        try {
            let result = db.prepare(`SELECT * from http_cookies where request_id = :id and is_response = 0`).all({"id":req.request_id});
            expect(result.length).toBe(2);

            result.forEach((value)=>{
                expect(['c_param1','c_param2']).toContain(value.name);

                switch(value.name){
                    case 'c_param1':
                        expect(value.value).toBe('12345667');
                        break;
                    case 'c_param2':
                        expect(value.value).toBe('blah');
                        break;
                    default:
                        done(new Error("no defined cookies"));
                }
            });

        } catch(e) {
            return done(e);
        }
        next();
    });

    app.use((req,res)=>{
        res.writeHead(200,{
            'Content-Type':'application/text',
            'X-val': 3
        }); 
        res.end(""+req.request_id);
    });


    request(app)
        .get('/mytest?param1=lorem_ipsum&param2=Jack%20Sprarrows')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .end((err,res)=>{
            if (err) return done(err);
            done();
        });
});

test('HTTP POST logs data', (done) => {


    const db = createDb(':memory:');

    const app = connect();
    app.use(log_request(db,false));
        
    app.use((req,res,next)=>{
        try{
            expect(req.request_id).toBeDefined();      
        } catch(e){
            done(e)
        }

        try {
            let result = db.prepare('SELECT * from requests where id = :id').all({"id":req.request_id});
            expect(result.length).toEqual(1);
            result = result.pop();
                
            expect(result.domain).toEqual('example.com');
            expect(result.protocol).toEqual('http');
            expect(result.method).toEqual('GET');
            expect(result.response_body).toEqual('{"name":"john"}');
        }catch(e){
           return done(e);
        }

        try {
            let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='host' and value <> 'example.com'`).get({"id":req.request_id});
            expect(result.count).toEqual(0);
        }catch(e){
           return done(e);
        }

        try {
            let result = db.prepare(`SELECT value from http_headers where request_id = :id and name='x-myheader' `).get({"id":req.request_id});
            expect(parseInt(result.value)).toEqual(3);
        }catch(e){
            return done(e);
        }

        try {
            let result = db.prepare(`SELECT * from request_http_params where request_id = :id `).all({"id":req.request_id});
            expect(parseInt(result.length)).toEqual(2);

            result.forEach((value)=>{
                expect(['param1','param2']).toContain(value.name);
                switch(value.name){
                    case 'param1':
                        expect(value.value).toBe('lorem_ipsum');
                        break;
                    case 'param2':
                        expect(value.value).toBe('Jack Sprarrows');
                        break;
                    default:
                        done(new Error("no defined values"));
                }

                expect(value.value_in_file).toBe(0);
            });

        } catch(e) {
          return done(e);
        }

        try {
            let result = db.prepare(`SELECT * from http_cookies where request_id = :id and is_response = 0`).all({"id":req.request_id});
            expect(result.length).toBe(2);

            result.forEach((value)=>{
                expect(['c_param1','c_param2']).toContain(value.name);

                switch(value.name){
                    case 'c_param1':
                        expect(value.value).toBe('12345667');
                        break;
                    case 'c_param2':
                        expect(value.value).toBe('blah');
                        break;
                    default:
                        done(new Error("no defined cookies"));
                }
            });

        } catch(e) {
            return done(e);
        }
        next();
    });

    app.use((req,res)=>{
        res.writeHead(200,{
            'Content-Type':'application/text',
            'X-val': 3
        }); 
        res.end(""+req.request_id);
    });


    request(app)
        .post('/mytest?param1=lorem_ipsum&param2=Jack%20Sprarrows')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .send({name: 'john'})
        .end((err,res)=>{
            if (err) return done(err);
            done();
        });
});
