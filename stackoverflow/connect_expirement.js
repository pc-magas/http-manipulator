const connect = require('connect');
const url = require('url');

const app = connect();

app.use(function(req,res,next){
    req.id = 1;
    next();

    const queryData = url.parse(req.url, true).query;
    console.log(queryData);
    Object.keys(queryData).forEach((key)=>{
        console.log(key,queryData[key]);
    });

    res.on('finish',()=>{
        const headers = res.getHeaders();
        console.log(headers);
        Object.keys(headers).forEach( key => {
            console.log(key,headers[key]);
        });
    })
});

app.use(function(req,res,next){
    console.log(req.id);
    res.setHeader("Content-Type",'application/text');
    res.writeHead(200,{'X-val':3});
    res.end("jhello");
});

app.listen(8090)