const db = require('../../../src/common/db.js');
const redirect = require('../../../src/controll_panel/models/redirect_model.js');

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