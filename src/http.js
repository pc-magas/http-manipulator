let https;

try {
  https = require('node:https');
} catch (err) {
  console.log('https support is disabled!');
}

const handle = (req,res)=>{};

function createServer(usr_cert_path,standart_cert_path){
  const secureContext = {
    'mydomain.com': tls.createSecureContext({
        key: fs.readFileSync('../path_to_key1.pem', 'utf8'),
        cert: fs.readFileSync('../path_to_cert1.crt', 'utf8'),
        ca: fs.readFileSync('../path_to_certificate_authority_bundle.ca-bundle1', 'utf8'), // this ca property is optional
    }),
    'myotherdomain.com': tls.createSecureContext({
        key: fs.readFileSync('../path_to_key2.pem', 'utf8'),
        cert: fs.readFileSync('../path_to_cert2.crt', 'utf8'),
        ca: fs.readFileSync('../path_to_certificate_authority_bundle.ca-bundle2', 'utf8'), // this ca property is optional
    }),
  }
  
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
    key: fs.readFileSync('../path_to_key.pem'), 
    cert: fs.readFileSync('../path_to_cert.crt'), 
  };
  
  return https.createServer(options,handle);
}


module.exports.createServer = createServer;