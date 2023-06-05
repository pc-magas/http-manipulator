const connect = require('connect');
const parseMultipart = require('../src/common/http_utils/multipart');
const {Buffer} = require("node:buffer");

const app = connect();

app.use(function(req,res,next){

    var body = [];

    req.on('data',(data) => body.push(data) );

    req.on('end',() => {

        body = Buffer.concat(body).toString();
        console.log(req.headers);
        if(req.headers['content-type'].includes('multipart/form-data')){
            parseMultipart(body);
        }

    });

    next();
});

app.use(function(req,res){
    console.log("id:",req.id);
    res.setHeader("Content-Type",'text/plain');
    res.writeHead(200,{'X-val':3});
    res.end("jhello");
});

app.listen(8090)