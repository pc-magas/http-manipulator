const fs = require('fs');
const { exit } = require('process');
const tls = require('tls');
const path = require('path');

  let https;
  try {
    https = require('node:https');
  } catch (err) {
    console.log('https support is disabled!');
    exit(-1)
  }
  
  const cert_dir = '/etc/http_manipulator/ssl/usr';
  const secureContext = {}
  
  fs.readdir(cert_dir,(err, files) => {
    if (err){
        console.log(err);
    } else {
        files.filter(item => {
            return path.extname(item)=='.cert'
        }).forEach(file => {
            console.log(file);
            const cert = path.join(cert_dir,file);
            const key = path.join(cert_dir,(path.basename(file,".cert")+".key"))

            fs.stat(key, (err, stat) => {
                if(err == null){
                  const domain = tls.getServerIdentity(cert).name;
                  console.log("DOMAIN "+domain);
                }
            });
        });
    }
});

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
    key: fs.readFileSync( path.join(cert_dir,'/../default.key')), 
    cert: fs.readFileSync(path.join(cert_dir,'/../default.cert')), 
  };
  
  const handle = (req,res)=>{
    res.writeHead(200);
    res.end("hello world\n");
  };

  const server = https.createServer(options,handle);