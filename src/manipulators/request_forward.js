const http = require('http');
const https = require('http');
const connect = require('connect');

const {getProtocol} = require('../common/http_utils');

const default_redirector = connect();


default_redirector.use((req,res,next) => {
    
    console.log(`Forwardinf request ${req.url}`)

    const http_handler = getProtocol(req) == 'http'?http:https;
    
    http_handler.request({
        host: req.headers.host,
        path: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
    },(resp)=>{
        resp.pipe(res);
    });

    req.pipe(http_handler);

    next();
});


module.exports.forward_default = default_redirector;