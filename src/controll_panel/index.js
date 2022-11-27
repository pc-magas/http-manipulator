const express = require('express');
const ws = require('ws');
const path = require('path');
const express_handlebars = require('express-handlebars');

const app = express();
const wsServer = new ws.WebSocketServer({ noServer: true });


const hbs = express_handlebars.create({
    // Specify helpers which are only registered on this instance.
    helpers: {
        // foo() { return 'FOO!'; },
        // bar() { return 'BAR!'; }
    },
    defaultLayout: 'main'
});

app.use('/static',express.static(path.join(__dirname,'/../../static')));
wsServer.on('connection', function connection(ws) {
    // ...
});

wsServer.on('message',function connection(ws) {
    // ...
});

app.engine('handlebars', hbs.engine); 
app.set('view engine', 'handlebars');
app.set('views',path.join(__dirname,'/../../views'));

app.get('/', (req, res, next) => {
    res.render('home');
});

module.exports.listen = function(port) {
    console.log("Listening for control panel");
    const server = app.listen(port);
    server.on('upgrade', (request, socket, head) => {
        wsServer.handleUpgrade(request, socket, head, socket => {
          wsServer.emit('connection', socket, request);
        });
     });
};

module.exports.notiFyForHttpCall = (http,httpRaw) => {
    const message = {
        type:"http",
        http: http,
        rawData:httpRaw
    }
    wsServer.send(message);
}