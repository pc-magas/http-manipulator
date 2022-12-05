const control_panel = require('./controll_panel/index.js');

let https;
try {
  https = require('node:https');
} catch (err) {
  console.log('https support is disabled!');
}

const server = https.createServer((req,res)=>{

});

server.listen(449);

control_panel.listen(3000);