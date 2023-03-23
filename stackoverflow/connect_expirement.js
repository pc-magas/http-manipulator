const connect = require('connect');
const url = require('url');
const cookieParser = require('cookie-parser');

const app = connect();

app.use(cookieParser());


app.use(function(req,res,next){
    req.id = 1;

    console.log(req.cookies);


    res.on('finish',()=>{
        const headers = res.getHeaders();
        console.log(headers);
        Object.keys(headers).forEach( key => {
            console.log(key,headers[key]);
        });
    })
    next();
});

app.use(function(req,res){
    console.log("id:",req.id);
    res.setHeader("Content-Type",'text/plain');
    res.writeHead(200,{'X-val':3});
    res.end("jhello");
});

app.listen(8090)