const connect = require('connect');

const app1 = connect();

const app2 = connect();

app2.use(function(req, res){
    res.end('Hello from Connect!\n');
});

app1.use(app2);

app1.listen(8090);