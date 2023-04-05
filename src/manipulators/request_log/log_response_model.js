

/**
 * Update request entry Upon response with nessesary values
 * @param {*} db 
 * @param {*} res 
 * @param {Int} insertId 
 */
const updateResponse = (db,res,insertId) => {

    const query = `
        UPDATE requests SET 
            response_status_code = :status_code,
            response_timestamp_unix_nanosecond = :response_timestamp
        WHERE 
            id = :id
    `;
    const statement = db.prepare(query);
   
    const transaction =  db.transaction((value)=> {
        statement.run(value);       
    });

    transaction({
        "status_code": res.statusCode,
        "response_timestamp": hrtime.bigint(),
        'id': insertId
    });
        
    insertResponseHeaders(db,res,insertId);
    logResponseCookies(db,res,insertId);
}

/**
 * Save reponse cookies into database
 * @param {*} db 
 * @param {*} res 
 * @param {Int} insertId  
 */
const logResponseCookies = (db,res,insertId) => {
    const headers = res.getHeaders();
    
    if(Object.keys(headers).length === 0 ){
        return;
    }

    const query = `
        INSERT INTO 
            http_cookies(
                request_id,
                name,
                value,
                is_response,
                http_only,
                secure,
                same_site_policy,
                expiration_timestamp,
                max_age
            )
        VALUES 
        (
            :request_id,
            :name,
            :value,
            1,
            :http_only,
            :secure,
            :same_site_policy,
            :expiration_timestamp,
            :max_age
        ) 
    `;

    const statement = db.prepare(query);

    Object.keys(headers).filter((key)=>key=='set-cookie').forEach( cookie_key => {
        const cookie_value = parseResponseCookie(headers[cookie_key]);

        if(cookie_value == {}) return;

        statement.run(
            {
                "name":cookie_value.name,
                "value":cookie_value.value,
                "http_only":cookie_value.httpOnly?1:0,
                "secure":cookie_value.secure?1:0,
                "same_site_policy":cookie_value.samesite_policy,
                "expiration_timestamp":cookie_value.expires,
                "max_age": cookie_value.max_age,
                "request_id":insertId
            });

    });
}

/**
 * save response headers into the database
 * @param {*} db 
 * @param {*} res 
 * @param {Int} insertId FK of the inserted request 
 */
const insertResponseHeaders = (db,res,insertId) => {
        
    const headers = res.getHeaders();
    
    if(Object.keys(headers).length === 0 ){
        return;
    }

    const header_query = `
        INSERT into http_headers (request_id,name,value,is_response) VALUES (
            :request_id,
            :name,
            :values,
            1
        );
    `
    const headerInsert = db.prepare(header_query);



    const transaction =  db.transaction((headers) => {
        
        Object.keys(headers).forEach( name => {
            const value = headers[name];

            headerInsert.run({
                "name": name,
                "value":value,
                "request_id": insertId
            });
        });
    });
    transaction(headers);
};



module.exports = updateResponse;