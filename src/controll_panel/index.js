const express = require('express');
const ws = require('ws');
const path = require('path');
const express_handlebars = require('express-handlebars');
const EventEmitter = require('node:events');

const app = express();
const wsServer = new ws.WebSocketServer({ noServer: true });

const myEmitter = new EventEmitter();


const hbs = express_handlebars.create({
    // Specify helpers which are only registered on this instance.
    helpers: {
        // foo() { return 'FOO!'; },
        // bar() { return 'BAR!'; }
    },
    defaultLayout: 'main'
});

app.engine('handlebars', hbs.engine); 
app.set('view engine', 'handlebars');
app.set('views',path.join(__dirname,'/../../views'));

wsServer.on('connection', function connection(ws) {
    console.log("Websocket connected");
    myEmitter.on('http', function(e) {
        ws.send(e.data);
    });
});

wsServer.on('message',function connection(ws) {
    console.log("Websocket received a message");

});


app.use('/static',express.static(path.join(__dirname,'/../../static')));
app.use('/static/css/boostrap',express.static(path.join(__dirname,'/../../node_modules/bootstrap/dist/css')));
app.use('/static/css/boostrap/icon/',express.static(path.join(__dirname,'/../../node_modules/bootstrap-icons')));
app.use('/static/js/boostrap',express.static(path.join(__dirname,'/../../node_modules/bootstrap/dist/js')));

app.use('/static/js/jquery',express.static(path.join(__dirname,'/../../node_modules/jquery/dist')));


app.get('/', (req, res, next) => {
    res.render('home',{
        title:'Homepage',
        js: [
            '/static/js/home.js'
        ],
        baseUrl: `${req.protocol}://${req.get('host')}`
    });
});

app.get('/licence',(req,res,next)=>{
    res.render('licence');
})



module.exports.listen = function(port) {
    console.log("Listening for control panel at port "+port);

    const server = app.listen(port);
    server.on('upgrade', (request, socket, head) => {
        wsServer.handleUpgrade(request, socket, head, socket => {
          wsServer.emit('connection', socket, request);
        });
     });
};

module.exports.event = myEmitter;