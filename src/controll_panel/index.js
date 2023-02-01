const ws = require('ws');
const path = require('path');
const EventEmitter = require('node:events');

// const express = require('express');
const connect = require('connect');
const urlrouter = require('urlrouter');
const serveStatic = require('serve-static');

const nunjunks = require('./views');


// const app = express();
const app = connect();

app.use('/static',serveStatic(path.join(__dirname,'/../../static')));
app.use('/static/css/boostrap',serveStatic(path.join(__dirname,'/../../node_modules/bootstrap/dist/css')));
app.use('/static/css/boostrap/icon/',serveStatic(path.join(__dirname,'/../../node_modules/bootstrap-icons')));
app.use('/static/js/boostrap',serveStatic(path.join(__dirname,'/../../node_modules/bootstrap/dist/js')));

app.use('/static/js/jquery',serveStatic(path.join(__dirname,'/../../node_modules/jquery/dist')));

const getProtocol = (req) => {
    if(req.protocol) return req.protocol;
    
    return req.secure ? 'https':'http';
}

const router = urlrouter(function (app) {
    app.get('/', (req, res, next) => {
        nunjunks.render('home.njk', {
                title:'Homepage',
                js: [
                    '/static/js/home.js'
                ],
                baseUrl: `${getProtocol(req)}://${req.headers.host}`
        },(err,response)=>{
            res.end(response);
        })
    });

    app.get('/licence',(req,res,next)=>{
        nunjunks.render('licence.njk',{},(err,response)=>{
            res.end(response);
        });
    })
});

app.use(router);

const wsServer = new ws.WebSocketServer({ noServer: true });
const myEmitter = new EventEmitter();

wsServer.on('connection', function connection(ws) {
    console.log("Websocket connected");
    myEmitter.on('http', function(e) {
        ws.end(e.data);
    });
});

wsServer.on('message',function connection(ws) {
    console.log("Websocket received a message");
});

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