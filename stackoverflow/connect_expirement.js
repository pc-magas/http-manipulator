const connect = require('connect');
const {detectBodyMime} = require('../src/common/http_utils');

const querystring = require("node:querystring");


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

        console.log(req.headers);
        body = Buffer.concat(body).toString();
        
        detectBodyMime(body,(err,mime,extention,content)=>{
            if(mime == 'application/x-www-form-urlencoded'){
                const parsedData = { ...querystring.parse(content.toString()) };
                Object.keys(parsedData).forEach((key)=>{
                   const value = parsedData[key];
                   console.log("DUMP",key,value);
                });
            }

            console.log(content.toString());
            console.log(mime);
        });

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