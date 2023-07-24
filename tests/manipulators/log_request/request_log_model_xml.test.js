const os = require('os');
const path = require('path');

const request = require('supertest');
const connect = require('connect');

const log_request = require('../../../src/manipulators/request_log/log_request_model.js');
const {createDb} = require('../../../src/common/db.js');

const savepath = os.tmpdir() ;

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

                const expected_save_path = path.join(savepath,insert_id+'/body.raw');
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

                const expected_save_path = path.join(savepath,insert_id+'/body.raw');
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

                const expected_save_path = path.join(savepath,insert_id+'/body.raw');
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