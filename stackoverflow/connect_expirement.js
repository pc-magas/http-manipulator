const connect = require('connect');

const app = connect();

app.use(function(req,res,next){
    req.id = 1;
    next();
});

app.use(function(req,res,next){
    console.log(req.id);
    res.end("jhello");
});

app.listen(8090)