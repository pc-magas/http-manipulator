const ws = require('ws');
const path = require('path');
const EventEmitter = require('node:events');

const express = require('express');

const {getBaseUrl} = require('../common/http_utils');
const nunjunks = require('./views');

const app = express();

app.use(express.urlencoded());

app.use('/static',express.static(path.join(__dirname,'/../../static')));
app.use('/static/css/boostrap',express.static(path.join(__dirname,'/../../node_modules/bootstrap/dist/css')));
app.use('/static/css/boostrap/icon/',express.static(path.join(__dirname,'/../../node_modules/bootstrap-icons')));

app.use('/static/js/boostrap',express.static(path.join(__dirname,'/../../node_modules/bootstrap/dist/js')));
app.use('/static/js/jquery',express.static(path.join(__dirname,'/../../node_modules/jquery/dist')));
app.use('/static/js/gridjs',express.static(path.join(__dirname,'/../../node_modules/gridjs/dist')));


app.get('/settings',function(req,res){
    const url = getBaseUrl(req);
    console.log(url);
    console.log(url);
    res.setHeader('Location', url+'/settings/redirect/https')
    res.send(301);
});
    
app.get('/', (req, res, next) => {
    nunjunks.render('home.njk', {
        title:'Homepage',
        js: [
            '/static/js/home.js'
        ],
        baseUrl: getBaseUrl(req)
    },(err,response)=>{
        res.end(response);
    })
    
});

app.get('/licence',(req,res,next)=>{
    nunjunks.render('licence.njk',{},(err,response)=>{
        res.end(response);
    });
})

const redirect = require('./controllers/redirect_settings');

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

module.exports.listen = function(port,db) {
    console.log("Listening for control panel at port "+port);

    redirect(db,app);


    const server = app.listen(port);
    server.on('upgrade', (request, socket, head) => {
        wsServer.handleUpgrade(request, socket, head, socket => {
          wsServer.emit('connection', socket, request);
        });
     });
};

module.exports.event = myEmitter;