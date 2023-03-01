const db = require('../../../src/common/db.js').createDb;
const redirect = require('../../../src/controll_panel/models/redirect_model.js');
const {http_methods,no_301_301_http_methods} = require('../../../src/constants.js');
const { map } = require('jquery');

test("Save REDIRECT Http to https returning 301 on GET method",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveRedirectHttps(db_con,'https://google.com','GET',301);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);


    let result = db_con.prepare("SELECT * from redirect").all();
    result = result.pop();
    expect(result.url_from).toEqual('google.com');
    expect(result.url_to).toEqual('https://google.com');
    expect(result.method).toEqual('GET');
    expect(parseInt(result.http_status_code)).toEqual(301);
    expect(result.exact_match).toEqual(0);
    expect(result.use_in_https).toEqual(0);
    expect(result.use_in_http).toEqual(1);

    done(); 
});

test("Save REDIRECT Http to https returning 302 on GET method",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveRedirectHttps(db_con,'https://google.com','GET',302);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);


    let result = db_con.prepare("SELECT * from redirect").all();
    result = result.pop();
    expect(result.url_from).toEqual('google.com');
    expect(result.url_to).toEqual('https://google.com');
    expect(result.method).toEqual('GET');
    expect(parseInt(result.http_status_code)).toEqual(302);
    expect(result.exact_match).toEqual(0);
    expect(result.use_in_https).toEqual(0);
    expect(result.use_in_http).toEqual(1);

    done(); 
});

test("Save REDIRECT Http to https returning 307 on All http methods",(done) => {

    const db_con = db(':memory:');

    try{
        redirect.saveRedirectHttps(db_con,'https://google.com',http_methods,307);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(http_methods.length);


    let result = db_con.prepare("SELECT * from redirect").all();
    result.forEach((item) => {
        expect(item.url_from).toEqual('google.com');
        expect(item.url_to).toEqual('https://google.com');
        expect(http_methods).toContain(item.method);
        expect(parseInt(item.http_status_code)).toEqual(307);
        expect(item.exact_match).toEqual(0);
        expect(item.use_in_https).toEqual(0);
        expect(item.use_in_http).toEqual(1);
    });

    done(); 
});

test("Save REDIRECT Http to https returning 308 on All http methods",(done) => {

    const db_con = db(':memory:');

    try{
        redirect.saveRedirectHttps(db_con,'https://google.com',http_methods,307);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(http_methods.length);


    let result = db_con.prepare("SELECT * from redirect").all();
    result.forEach((item) => {
        expect(item.url_from).toEqual('google.com');
        expect(item.url_to).toEqual('https://google.com');
        expect(http_methods).toContain(item.method);
        expect(parseInt(item.http_status_code)).toEqual(307);
        expect(item.exact_match).toEqual(0);
        expect(item.use_in_https).toEqual(0);
        expect(item.use_in_http).toEqual(1);
    });

    done(); 
});


test("Cannot Save REDIRECT Http to https returning 301 on All http methods",(done) => {

    const db_con = db(':memory:');

    const expected_messages = `301 redirection is supported only for methods "PUT,POST,PATCH".`
    
    try{
        redirect.saveRedirectHttps(db_con,'https://google.com',http_methods,301);
    } catch(e){
        expect(e.toString().replace("Error: ","")).toEqual(expected_messages);
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done(); 
});

test("Cannot Save REDIRECT Http to https returning 302 on All http methods",(done) => {

    const db_con = db(':memory:');

    const expected_messages = `302 redirection is supported only for methods "PUT,POST,PATCH".`
    
    try{
        redirect.saveRedirectHttps(db_con,'https://google.com',http_methods,302);
    } catch(e){
        expect(e.toString().replace("Error: ","")).toEqual(expected_messages);
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done(); 
});

test("Cannot Save redirect Http to https returning 302 on All http methods except get",(done)=>{    
    const expected_messages = `302 redirection is supported only for methods "PUT,POST,PATCH".`

    http_methods.forEach((method)=>{

        if(["GET","HEAD","OPTIONS","DELETE"].indexOf(method) != -1 ) return;

        const db_con = db(':memory:');
        
        try{
            redirect.saveRedirectHttps(db_con,'https://google.com',method,302);
        } catch(e){
            expect(e.toString().replace("Error: ","")).toEqual(expected_messages);
        }

        let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
        count_result = count_result.pop();
        count_result = count_result.total;
        expect(count_result).toEqual(0);
    });
    done();
});

test("Cannot Save redirect Http to https returning 302 on All http methods except get",(done)=>{    
    const expected_messages = `301 redirection is supported only for methods "PUT,POST,PATCH".`

    http_methods.forEach((method)=>{

        if(["GET","HEAD","OPTIONS","DELETE"].indexOf(method) != -1 ) return;

        const db_con = db(':memory:');
        
        try{
            redirect.saveRedirectHttps(db_con,'https://google.com',method,301);
        } catch(e){
            expect(e.toString().replace("Error: ","")).toEqual(expected_messages);
        }

        let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
        count_result = count_result.pop();
        count_result = count_result.total;
        expect(count_result).toEqual(0);
    });
    done();
});

test("Save REDIRECT Http to https returning 301 on GET method (get as an array multiple times)",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveRedirectHttps(db_con,'https://google.com',['GET','get','gET',"Get","geT","    GeT  "],301);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);


    let result = db_con.prepare("SELECT * from redirect").all();
    result = result.pop();
    expect(result.url_from).toEqual('google.com');
    expect(result.url_to).toEqual('https://google.com');
    expect(result.method).toEqual('GET');
    expect(parseInt(result.http_status_code)).toEqual(301);
    expect(result.exact_match).toEqual(0);
    expect(result.use_in_https).toEqual(0);
    expect(result.use_in_http).toEqual(1);

    done(); 
});


test("Save REDIRECT Http to https returning 307 on Multiple http methods with duplicates",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveRedirectHttps(db_con,'https://google.com',['GET',"post","posT","pOsT  ",'get',"POST",'gET',"Get","geT","pOsT",],307);
    } catch(e){
        done(e);
        return;
    }

    const expected_methods = ["GET","POST"];

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(2);


    const results = db_con.prepare("SELECT * from redirect").all();
    results.forEach((result) => {
        expect(result.url_from).toEqual('google.com');
        expect(result.url_to).toEqual('https://google.com');
        expect(expected_methods).toContain(result.method);
        expect(parseInt(result.http_status_code)).toEqual(307);
        expect(result.exact_match).toEqual(0);
        expect(result.use_in_https).toEqual(0);
        expect(result.use_in_http).toEqual(1);
    });
    done(); 
});

test("ON Invalid method error must be thrown",(done) => {

    const db_con = db(':memory:');
   
    try{
        redirect.saveRedirectHttps(db_con,'https://google.com',["METAL"],307);
        // Method above should throw exception id not assume it as failing test
        done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        expect(true).toEqual(true);
    }
   
    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done();
});

test("ON Invalid http code error must be thrown",(done) => {

    const db_con = db(':memory:');
   
    try{
        redirect.saveRedirectHttps(db_con,'https://google.com',["GET"],1000);
        // Method above should throw exception id not assume it as failing test
        done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        expect(true).toEqual(true);
    }
   
    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done();
});

test("ON non redirect http code error must be thrown",(done) => {

    const db_con = db(':memory:');
   
    try{
        redirect.saveRedirectHttps(db_con,'https://google.com',["POST"],200);
        // Method above should throw exception id not assume it as failing test
        done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        expect(true).toEqual(true);
    }
   
    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done();
});

test("ON Invalid url error must be thrown",(done) => {

    const db_con = db(':memory:');
   
    try{
        redirect.saveRedirectHttps(db_con,'dsasdsasaasads',["GET"],307);
        // Method above should throw exception id not assume it as failing test
        done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        expect(true).toEqual(true);
    }
   
    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done();
});

test("ON Invalid url and method error must be thrown",(done) => {

    const db_con = db(':memory:');
   
    try{
        redirect.saveRedirectHttps(db_con,'dsasdsasaasads',["Metal"],307);
        // Method above should throw exception id not assume it as failing test
        done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        expect(true).toEqual(true);
    }
   
    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done();
});

test("ON Invalid params error must be thrown",(done) => {

    const db_con = db(':memory:');
   
    try{
        redirect.saveRedirectHttps(db_con,'dsasdsasaasads',["Metal"],1000);
        // Method above should throw exception id not assume it as failing test
        done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        expect(true).toEqual(true);
    }
   
    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done();
});

test("Save Advanced REDIRECT returning 301 on GET method",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com','GET',301,true,false,false);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);


    let result = db_con.prepare("SELECT * from redirect").all();
    result = result.pop();
    expect(result.url_from).toEqual('google.com');
    expect(result.url_to).toEqual('https://yahoo.com');
    expect(result.method).toEqual('GET');
    expect(parseInt(result.http_status_code)).toEqual(301);
    expect(result.exact_match).toEqual(0);
    expect(result.use_in_https).toEqual(0);
    expect(result.use_in_http).toEqual(1);
    expect(result.exact_match).toEqual(0);

    done(); 
});

test("Save Advanced REDIRECT returning 301 on GET method upon https",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com','GET',301,false,true,false);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);


    let result = db_con.prepare("SELECT * from redirect").all();
    result = result.pop();
    expect(result.url_from).toEqual('google.com');
    expect(result.url_to).toEqual('https://yahoo.com');
    expect(result.method).toEqual('GET');
    expect(parseInt(result.http_status_code)).toEqual(301);
    expect(result.exact_match).toEqual(0);
    expect(result.use_in_https).toEqual(1);
    expect(result.use_in_http).toEqual(0);
    expect(result.exact_match).toEqual(0);

    done(); 
});

test("Save Advanced REDIRECT returning 301 on GET method upon http & https",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com','GET',301,true,true,true);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);


    let result = db_con.prepare("SELECT * from redirect").all();
    result = result.pop();
    expect(result.url_from).toEqual('google.com');
    expect(result.url_to).toEqual('https://yahoo.com');
    expect(result.method).toEqual('GET');
    expect(parseInt(result.http_status_code)).toEqual(301);
    expect(result.exact_match).toEqual(1);
    expect(result.use_in_https).toEqual(1);
    expect(result.use_in_http).toEqual(1);

    done(); 
});

test("Save Advanced REDIRECT returning 302 on GET method",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com','GET',302,true,false,false);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);


    let result = db_con.prepare("SELECT * from redirect").all();
    result = result.pop();
    expect(result.url_from).toEqual('google.com');
    expect(result.url_to).toEqual('https://yahoo.com');
    expect(result.method).toEqual('GET');
    expect(parseInt(result.http_status_code)).toEqual(302);
    expect(result.exact_match).toEqual(0);
    expect(result.use_in_https).toEqual(0);
    expect(result.use_in_http).toEqual(1);
    expect(result.exact_match).toEqual(0);

    done(); 
});

test("Save Advanced REDIRECT returning 302 on GET method upon http & https",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com','GET',302,true,true,true);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);


    let result = db_con.prepare("SELECT * from redirect").all();
    result = result.pop();
    expect(result.url_from).toEqual('google.com');
    expect(result.url_to).toEqual('https://yahoo.com');
    expect(result.method).toEqual('GET');
    expect(parseInt(result.http_status_code)).toEqual(302);
    expect(result.exact_match).toEqual(1);
    expect(result.use_in_https).toEqual(1);
    expect(result.use_in_http).toEqual(1);

    done(); 
});

test("Save Advanced REDIRECT returning 308 on all http methods upon http & https",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com',http_methods,307,true,true,true);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(http_methods.length);


    let results = db_con.prepare("SELECT * from redirect").all();
    results.forEach((result) => {
        expect(result.url_from).toEqual('google.com');
        expect(result.url_to).toEqual('https://yahoo.com');
        expect(http_methods).toContain(result.method);
        expect(parseInt(result.http_status_code)).toEqual(307);
        expect(result.exact_match).toEqual(1);
        expect(result.use_in_https).toEqual(1);
        expect(result.use_in_http).toEqual(1);
    });
    done(); 
});

test("Save Advanced REDIRECT returning 308 on all http methods upon http & https",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com',http_methods,308,true,true,true);
    } catch(e){
        done(e);
        return;
    }

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(http_methods.length);


    let results = db_con.prepare("SELECT * from redirect").all();
    results.forEach((result) => {
        expect(result.url_from).toEqual('google.com');
        expect(result.url_to).toEqual('https://yahoo.com');
        expect(http_methods).toContain(result.method);
        expect(parseInt(result.http_status_code)).toEqual(308);
        expect(result.exact_match).toEqual(1);
        expect(result.use_in_https).toEqual(1);
        expect(result.use_in_http).toEqual(1);
    });
    done(); 
});

test("ON Invalid method error must be thrown",(done) => {

    const db_con = db(':memory:');
   
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com','METAL',302,true,true,true);
        // Method above should throw exception id not assume it as failing test
        done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        expect(true).toEqual(true);
    }
   
    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done();
});

test("ON Invalid http code error must be thrown",(done) => {

    const db_con = db(':memory:');
   
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com','POST',302,true,true,true);
        // Method above should throw exception id not assume it as failing test
        done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        expect(true).toEqual(true);
    }
   
    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done();
});

test("Cannot save multiple times on http",(done) => {

    const db_con = db(':memory:');
    
    const sql = `INSERT INTO redirect (
        url_from,
        url_to,
        method,
        http_status_code,
        use_in_http,
        use_in_https,
        exact_match
    ) values (
        'https://google.com',
        'https://yahoo.com',
        'POST',
        308,
        1,
        0,
        1
    )`;
    db_con.exec(sql);

    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com','POST',308,true,true,true);
        // Method above should throw exception id not assume it as failing test
        // done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        // expect(true).toEqual(true);
    }
   
    console.log(db_con.prepare('SELECT * from redirect').all());

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);

    done();
});


test("Cannot save multiple times on https",(done) => {

    const db_con = db(':memory:');
    
    const sql = `INSERT INTO redirect (
        url_from,
        url_to,
        method,
        http_status_code,
        use_in_http,
        use_in_https,
        exact_match
    ) values (
        'https://google.com',
        'https://yahoo.com',
        'POST',
        308,
        0,
        1,
        1
    )`;
    db_con.exec(sql);

    try{
        var results = redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com','POST',308,true,true,true);
        // Method above should throw exception id not assume it as failing test
    } catch(e) {
       done(e)
    }
   
    console.log(db_con.prepare('SELECT * from redirect').all());

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(1);

    expect(results.errors.length).toEqual(0);
    expect(results.saved_values.length).toEqual(0);

    expect(results.duplicates.length).toEqual(1);

    const result = results.duplicates.pop();
    expect(result.url_from).toEqual('https://google.com');
    expect(result.url_to).toEqual('https://yahoo.com');
    expect(result.status_code).toEqual(308);
    expect(result.use_in_http).toEqual(1);
    expect(result.use_in_https).toEqual(1);
    expect(result.exact_match).toEqual(1);

    done();
});

test("Save REDIRECT Http to https returning 307 on Multiple http methods with duplicates",(done) => {
    const db_con = db(':memory:');
    try{
        redirect.saveAdvancedRedirect(db_con,'https://google.com','https://yahoo.com',['GET',"post","posT","pOsT  ",'get',"POST",'gET',"Get","geT","pOsT",],307);
    } catch(e){
        done(e);
        return;
    }

    const expected_methods = ["GET","POST"];

    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(2);


    const results = db_con.prepare("SELECT * from redirect").all();
    results.forEach((result) => {
        expect(result.url_from).toEqual('google.com');
        expect(result.url_to).toEqual('https://yahoo.com');
        expect(expected_methods).toContain(result.method);
        expect(parseInt(result.http_status_code)).toEqual(307);
        expect(result.exact_match).toEqual(0);
        expect(result.use_in_https).toEqual(0);
        expect(result.use_in_http).toEqual(1);
    });
    done(); 
});

test("ON Invalid url error must be thrown",(done) => {

    const db_con = db(':memory:');
   
    try{
        redirect.saveAdvancedRedirect(db_con,'dsasdsasaasads',"https://yahoo.com",["GET"],307);
        // Method above should throw exception id not assume it as failing test
        done(new Error("No error is thrown"));
    } catch(e) {
        // Dummy assertion
        expect(true).toEqual(true);
    }
   
    let count_result = db_con.prepare('SELECT count(*) as total from redirect').all();
    count_result = count_result.pop();
    count_result = count_result.total;
    expect(count_result).toEqual(0);

    done();
});