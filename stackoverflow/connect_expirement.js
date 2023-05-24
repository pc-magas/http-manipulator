const connect = require('connect');
const {detectBodyMime} = require('../src/common/http_utils');
const {Buffer} = require("node:buffer");

const app = connect();

app.use(function(req,res,next){

    var body = [];

    req.on('data',(data) => body.push(data) );

    req.on('end',() => {

        body = Buffer.concat(body).toString();
        
        detectBodyMime(body,(err,mime,extention,buffer)=>{
            res.setHeader("Content-Type",'text/plain');
            res.writeHead(200,{'X-val':3});

            res.end("MIME: "+mime+"\n"+"Suggested file extention: "+extention+"\n");
        });

    });
});

// app.use(function(req,res){
//     console.log("id:",req.id);
//     res.setHeader("Content-Type",'text/plain');
//     res.writeHead(200,{'X-val':3});
//     res.end("jhello");
// });

app.listen(8090)