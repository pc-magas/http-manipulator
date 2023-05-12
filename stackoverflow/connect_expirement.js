const connect = require('connect');
// const {detectBodyMime} = require('../src/common/http_utils');
const fs = require('fs');

const app = connect();

const detectMultipart = (string)=>{
    return string.indexOf('Content-Disposition: form-data; name="')>1;
};

app.use(function(req,res,next){
    req.id = 1;

    var body = [];

    req.on('data',(data) =>
    {
        console.log('Getting Body');
        body.push(data)
    });

    req.on('end',() => {

        console.log(req.headers);
        body = Buffer.concat(body).toString();
        fs.writeFileSync('./'+Date.now(),body);
        
        console.log("\n###########\n\n");
        console.log(detectMultipart(body));
        console.log("\n\n###########\n\n");

        next();
    });
});

app.use(function(req,res){
    console.log("id:",req.id);
    res.setHeader("Content-Type",'text/plain');
    res.writeHead(200,{'X-val':3});
    res.end("jhello");
});

app.listen(8090)