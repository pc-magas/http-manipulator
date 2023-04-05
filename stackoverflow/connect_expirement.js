const connect = require('connect');
const fs = require('fs');

const { detectBodyMime } = require('../src/common/http_utils');


const app = connect();

app.use(function(req,res,next){
    req.id = 1;

    var body = [];
    
    req.on('data',(data) =>
    {
        console.log('Getting Body');
        body.push(data)
    });

    req.on('end',() => {
        body = Buffer.concat(body).toString();
        console.log(req.headers['content-type']);
        if(body){
            detectBodyMime(body,(err,mime,extention,buffer)=>{
                    if (err) {return;}
                    console.log(mime,extention);
                    // console.log(buffer.toString());
            }); 
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