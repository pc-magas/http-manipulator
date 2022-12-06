let https;

try {
  https = require('node:https');
} catch (err) {
  console.log('https support is disabled!');
}

const handle = (req,res)=>{};

function createHttpsServer(db,default_key,default_cert,default_key){

  const secureContext = {}

  

  const options = {
    SNICallback: function (domain, cb) {
        if (secureContext[domain]) {
            if (cb) {
                cb(null, secureContext[domain]);
            } else {
                // compatibility for older versions of node
                return secureContext[domain]; 
            }
        } else {
            throw new Error('No keys/certificates for domain requested');
        }
    },
    // must list a default key and cert because required by tls.createServer()
    key: fs.readFileSync(default_cert), 
    cert: fs.readFileSync(default_cert), 
  };
  
  return https.createServer(options,handle);
}

function createHttpServer(port){
  return https.createServer(handle);
}

module.exports.createHttpsServer = createHttpsServer;
module.exports.createHttpServer = createHttpServer;