const os = require('os');

const request = require('supertest');
const connect = require('connect');

const log_request = require('../../../src/manipulators/request_log/log_request_model.js');
const {createDb} = require('../../../src/common/db.js');

const savepath = os.tmpdir() ;

test("Log Http Post Form Data", (done)=>{

    const db = createDb(':memory:');

    const app = connect();
    app.use( (req,res,next)=>{
        log_request(db,savepath,req,false,(error,insert_id) => {
            if(error){ return done(error);}

            try {
                expect(error).toBe(null);
                expect(insert_id).toBeDefined();
            } catch(e){
                return done(e);
            }
            
            try {
                let result = db.prepare('SELECT * from requests where id = :id').all({"id":insert_id});
                expect(result.length).toEqual(1);
                result = result.pop();
                    
                expect(result.domain).toEqual('example.com');
                expect(result.protocol).toEqual('http');
                expect(result.method).toEqual('POST');

                expect(result.path).toEqual("/example?param1=11&param2=22")
            }catch(e){
                return done(e);
            }

            try {
                let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='host' and value <> 'example.com'`).get({"id":insert_id});
                expect(result.count).toEqual(0);
            }catch(e){
                return done(e);
            }

            try {
                let result = db.prepare(`SELECT value from http_headers where request_id = :id and name='x-myheader' `).get({"id":insert_id});
                expect(parseInt(result.value)).toEqual(3);
            }catch(e){
                return done(e);
            }

            try {
                let result = db.prepare(`SELECT * from request_http_params where request_id = :id and param_location='URL' `).all({"id":insert_id});
                expect(parseInt(result.length)).toEqual(2);

                result.forEach((value)=>{
                    expect(['param1','param2']).toContain(value.name);
                    switch(value.name){
                        case 'param1':
                            expect(value.value).toBe('11');
                            break;
                        case 'param2':
                            expect(value.value).toBe('22');
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
                let result = db.prepare(`SELECT * from request_http_params where request_id = :id and param_location='BODY' `).all({"id":insert_id});
                expect(parseInt(result.length)).toEqual(2);

                result.forEach((value)=>{
                    expect(['username','password']).toContain(value.name);
                    switch(value.name){
                        case 'username':
                            expect(value.value).toBe('techbos');
                            break;
                        case 'password':
                            expect(value.value).toBe('Pa$$w0rd');
                            break;
                        default:
                            done(new Error("no defined values"));
                    }

                    expect(value.value_in_file).toBe(0);
                });

            } catch(e) {
              return done(e);
            }
        });

        next();
    });

    app.use((req,res)=>{
        res.end("Hello");
        done();
    })

    request(app)
        .post('/example?param1=11&param2=22')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .send("username=techbos&password=Pa%24%24w0rd")
        .then(()=>{});
});


test("Log Http Post Form Data Array", (done)=>{

    const db = createDb(':memory:');

    const app = connect();
    app.use( (req,res,next)=>{
        log_request(db,savepath,req,false,(error,insert_id) => {
            if(error){ return done(error);}

            try {
                expect(error).toBe(null);
                expect(insert_id).toBeDefined();
            } catch(e){
                return done(e);
            }
            
            try {
                let result = db.prepare('SELECT * from requests where id = :id').all({"id":insert_id});
                expect(result.length).toEqual(1);
                result = result.pop();
                    
                expect(result.domain).toEqual('example.com');
                expect(result.protocol).toEqual('http');
                expect(result.method).toEqual('POST');

                expect(result.path).toEqual("/example?param1=11&param2=22")
            }catch(e){
                return done(e);
            }

            try {
                let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='host' and value <> 'example.com'`).get({"id":insert_id});
                expect(result.count).toEqual(0);
            }catch(e){
                return done(e);
            }

            try {
                let result = db.prepare(`SELECT value from http_headers where request_id = :id and name='x-myheader' `).get({"id":insert_id});
                expect(parseInt(result.value)).toEqual(3);
            }catch(e){
                return done(e);
            }

            try {
                let result = db.prepare(`SELECT * from request_http_params where request_id = :id and param_location='URL' `).all({"id":insert_id});
                expect(parseInt(result.length)).toEqual(2);

                result.forEach((value)=>{
                    expect(['param1','param2']).toContain(value.name);
                    switch(value.name){
                        case 'param1':
                            expect(value.value).toBe('11');
                            break;
                        case 'param2':
                            expect(value.value).toBe('22');
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
                let result = db.prepare(`SELECT * from request_http_params where request_id = :id and param_location='BODY' `).all({"id":insert_id});
                expect(parseInt(result.length)).toEqual(4);

                result.forEach((value)=>{
                    expect(['username','password','val[]']).toContain(value.name);
                    switch(value.name){
                        case 'username':
                            expect(value.value).toBe('techbos');
                            break;
                        case 'password':
                            expect(value.value).toBe('Pa$$w0rd');
                            break;
                            case 'val[]':
                            expect(value.value_is_array).toBe(1);
                            expect([1,0]).toContain(parseInt(value.value));
                            expect([0,1]).toContain(parseInt(value.value_index));

                            if(value.value_index == 0){
                                expect(parseInt(value.value)).toBe(1);
                            } else if(value.index == 1){
                                expect(parseInt(value.value)).toBe(0);
                            }

                            break;
                        default:
                            done(new Error("no defined values"));
                    }

                    expect(value.value_in_file).toBe(0);
                });

            } catch(e) {
              return done(e);
            }
        });

        next();
    });

    app.use((req,res)=>{
        res.end("Hello");
        done();
    })

    request(app)
        .post('/example?param1=11&param2=22')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .send("username=techbos&password=Pa%24%24w0rd&val[]=1&val[]=0")
        .then(()=>{});
});