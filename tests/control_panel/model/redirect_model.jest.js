const db = require('../../../src/common/db.js');
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
    expect(result.url_to).toEqual('google.com');
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
    expect(result.url_to).toEqual('google.com');
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
        expect(item.url_to).toEqual('google.com');
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
        expect(item.url_to).toEqual('google.com');
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