const http = require('http');
const https = require('http');
const connect = require('connect');

const {getProtocol} = require('../common/http_utils');

const default_redirector = connect();


default_redirector.use((req,res,next) => {
    const http_handler = getProtocol(req) == 'http'?http:https;

    console.log(req.headers);

    const http_client = http_handler.request({
        host: req.headers.host,
        path: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
    },(resp)=>{
        res.writeHead(resp.statusCode,resp.headers);
        resp.pipe(res);
    });

    req.pipe(http_client);
});


module.exports.forward_default = default_redirector;