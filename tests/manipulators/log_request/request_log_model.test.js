const os = require('os');
const {ClientRequest} = require('http');

const log_request = require('../../../src/manipulators/request_log/log_request_model.js');
const {createDb} = require('../../../src/common/db.js');

const savepath = os.tmpdir() ;

test("Log Http Post Form Data", (done)=>{

    const db = createDb(':memory:');

    const requestMock = new ClientRequest("http://example.com/");

    log_request(db,savepath,requestMock,false,(error,insert_id) => {
        expect(error).toBe(null);
        expect(insert_id).notToBe(null);
        
        try {
            let result = db.prepare('SELECT * from requests where id = :id').all({"id":insert_id});
            expect(result.length).toEqual(1);
            result = result.pop();
                
            expect(result.domain).toEqual('example.com');
            expect(result.protocol).toEqual('http');
            expect(result.method).toEqual('POST');
            expect(result.response_body).toEqual("username=techbos&password=Pa%24%24w0rd");

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
            expect(parseInt(result.value)).toEqual(53);
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

        done();
    });
});