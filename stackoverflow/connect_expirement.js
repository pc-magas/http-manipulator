const connect = require('connect');

const app = connect();

app.use(function(req,res,next){
    req.id = 1;
    next();
    res.on('finish',()=>{
        console.log("Headers",res.getHeaders());
    })
});

app.use(function(req,res,next){
    console.log(req.id);
    res.setHeader("Content-Type",'application/text');
    res.writeHead(200,{'X-val':3});
    res.end("jhello");
});

app.listen(8090)