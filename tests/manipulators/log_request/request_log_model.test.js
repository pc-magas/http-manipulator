const os = require('os');
const path = require('path');

const request = require('supertest');
const connect = require('connect');

const log_request = require('../../../src/manipulators/request_log/log_request_model.js');
const {createDb} = require('../../../src/common/db.js');

const sha256File = require('sha256-file');

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

test("Log Http POST Multipart With File Data",(done)=>{

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
                            expect(value.value_in_file).toBe(0);
                            break;
                        case 'password':
                            expect(value.value).toBe('Pa$$w0rd');
                            expect(value.value_in_file).toBe(0);
                            break;
                        case 'val[]':
                            expect(value.value_in_file).toBe(0);
                            expect(value.value_is_array).toBe(1);
                            expect([1,0]).toContain(parseInt(value.value));
                            expect([0,1]).toContain(parseInt(value.value_index));

                            if(value.value_index == 0){
                                expect(parseInt(value.value)).toBe(1);
                            } else if(value.index == 1){
                                expect(parseInt(value.value)).toBe(0);
                            }

                            break;
                        case 'test':
                            expect(value.value_in_file).toBe(1);
                            const expected_path = path.join(savepath,insert_id,'multipart','test.png');
                            expect(value.value).toBe(expected_path);
                            
                            path.exists(expected_path, function(exists) { 
                                if (!exists) {
                                    done(new Error("no uploaded file exists"));
                                }
                                const new_hash = sha256File(value.value);
                                expect(new_hash).toBe('8784e7367eccc73470fd66a8553714507492a181a87a7f4cdcbc416362438a20'); 
                            }); 
                            
                            break;
                        default:
                            done(new Error("no defined values"));
                    }

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

    const fs = require('fs');
    const file =path.join(__dirname,'__testdata__','test.png');
    var data = fs.readFileSync(file);

    request(app)
        .post('/example?param1=11&param2=22')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set("Content-Type", "multipart/form-data")
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .field("username","techbos")
        .field("password","Pa$$w0rd")
        .field("val[]",1)
        .field("val[]",0)
        .attach('test',data,'test.png')
        .then(()=>{});
});

test("Log Http POST Multipart Without File Data",(done)=>{

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
        .set("Content-Type", "multipart/form-data")
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .field("username","techbos")
        .field("password","Pa$$w0rd")
        .field("val[]",1)
        .field("val[]",0)
        .then(()=>{});
});

test("Log Http Post Log XML", (done)=>{

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

                const expected_save_path = path.join(savepath,insert_id+'_body.raw');
                expect(result.raw_request_body_file).toEqual(expected_save_path);
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
                let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='conrtent-type' and value <> 'application/xml'`).get({"id":insert_id});
                expect(result.count).toEqual(0);
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
                expect(parseInt(result.length)).toEqual(0);
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

    const content = `<?xml version="1.0" encoding="UTF-8"?>
    <note>
      <to>Tove</to>
      <from>Jani</from>
      <heading>Reminder</heading>
      <body>Don't forget me this weekend!</body>
    </note>
    `;

    request(app)
        .post('/example?param1=11&param2=22')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set('Content-Type','application/xml')
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .send(content)
        .then(()=>{});
});


test("Log Http PUT Log XML", (done)=>{

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
                expect(result.method).toEqual('PUT');

                expect(result.path).toEqual("/example?param1=11&param2=22")

                const expected_save_path = path.join(savepath,insert_id+'_body.raw');
                expect(result.raw_request_body_file).toEqual(expected_save_path);
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
                let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='conrtent-type' and value <> 'application/xml'`).get({"id":insert_id});
                expect(result.count).toEqual(0);
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
                expect(parseInt(result.length)).toEqual(0);
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

    const content = `<?xml version="1.0" encoding="UTF-8"?>
    <note>
      <to>Tove</to>
      <from>Jani</from>
      <heading>Reminder</heading>
      <body>Don't forget me this weekend!</body>
    </note>
    `;

    request(app)
        .put('/example?param1=11&param2=22')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set('Content-Type','application/xml')
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .send(content)
        .then(()=>{});
});

test("Log Http PATCH Log XML", (done)=>{

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
                expect(result.method).toEqual('PATCH');

                expect(result.path).toEqual("/example?param1=11&param2=22")

                const expected_save_path = path.join(savepath,insert_id+'_body.raw');
                expect(result.raw_request_body_file).toEqual(expected_save_path);
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
                let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='conrtent-type' and value <> 'application/xml'`).get({"id":insert_id});
                expect(result.count).toEqual(0);
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
                expect(parseInt(result.length)).toEqual(0);
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

    const content = `<?xml version="1.0" encoding="UTF-8"?>
    <note>
      <to>Tove</to>
      <from>Jani</from>
      <heading>Reminder</heading>
      <body>Don't forget me this weekend!</body>
    </note>
    `;

    request(app)
        .patch('/example?param1=11&param2=22')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set('Content-Type','application/xml')
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .send(content)
        .then(()=>{});
});

test("Log Http Post Log JSON", (done)=>{

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

                const expected_save_path = path.join(savepath,""+insert_id+'_body.raw');
                expect(result.raw_request_body_file).toEqual(expected_save_path);
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
                let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='conrtent-type' and value <> 'application/json'`).get({"id":insert_id});
                expect(result.count).toEqual(0);
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
                expect(parseInt(result.length)).toEqual(0);
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

    const content = `{
        'name':1,
        'all':2
    }
    `;

    request(app)
        .post('/example?param1=11&param2=22')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set('Content-Type','application/json')
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .send(content)
        .then(()=>{});
});

test("Log Http PUT Log JSON", (done)=>{

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
                expect(result.method).toEqual('PUT');

                expect(result.path).toEqual("/example?param1=11&param2=22")

                const expected_save_path = path.join(savepath,""+insert_id+'_body.raw');
                expect(result.raw_request_body_file).toEqual(expected_save_path);
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
                let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='conrtent-type' and value <> 'application/json'`).get({"id":insert_id});
                expect(result.count).toEqual(0);
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
                expect(parseInt(result.length)).toEqual(0);
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

    const content = `{
        'name':1,
        'all':2
    }
    `;

    request(app)
        .put('/example?param1=11&param2=22')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set('Content-Type','application/json')
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .send(content)
        .then(()=>{});
});

test("Log Http PATCH Log JSON", (done)=>{

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
                expect(result.method).toEqual('PATCH');

                expect(result.path).toEqual("/example?param1=11&param2=22")

                const expected_save_path = path.join(savepath,""+insert_id+'_body.raw');
                expect(result.raw_request_body_file).toEqual(expected_save_path);
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
                let result = db.prepare(`SELECT count(*) as count from http_headers where request_id = :id and name='conrtent-type' and value <> 'application/json'`).get({"id":insert_id});
                expect(result.count).toEqual(0);
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
                expect(parseInt(result.length)).toEqual(0);
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

    const content = `{
        'name':1,
        'all':2
    }
    `;

    request(app)
        .patch('/example?param1=11&param2=22')
        .set('Host','example.com')
        .set('X-MyHeader',3)
        .set('Content-Type','application/json')
        .set("Cookie",  ['c_param1=12345667', 'c_param2=blah'])
        .send(content)
        .then(()=>{});
});