const fs = require('fs');
const http = require('node:http');
let https = require('node:https');
const connect = require('connect');

const redirect = require('./manipulators/redirect.js')

/**
 * Create an Https server with tls cert management
 * @param {*} db Sqlite database where ssl info is stored 
 * @param {*} default_key Default path for generic SSL key
 * @param {*} default_cert Default path for generic SSL cert
 * @returns A https connection where will listen to.
 */
function createHttpsServer(db,default_key,default_cert){

  const secureContext = {}

  const certs = db.prepare("SELECT * from certs").all();
  certs.forEach(function(row) {
    const ssl_context = {
      key: fs.readFileSync(row.key, 'utf8'),
      cert: fs.readFileSync(row.cert,'utf8')
    }
    if(row.ca != null || (typeof row.ca == String && row.ca.trim() != "")){
      ssl_context['ca'] = fs.readFileSync(row.ca.trim(),'utf8')
    }
    secureContext[row.domain] = tls.createSecureContext(ssl_context);
  })

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
    key: fs.readFileSync(default_key), 
    cert: fs.readFileSync(default_cert), 
  };
  
  const app = connect();
  app.use(redirect(db,true));

  return https.createServer(options,app);
}

function createHttpServer(db){

  const app = connect();
  app.use(redirect(db,false));

  return http.createServer(app);
}

module.exports.createHttpsServer = createHttpsServer;
module.exports.createHttpServer = createHttpServer;