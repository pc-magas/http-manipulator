// Nodejs Dependencies
const { exit, argv } = require('process');
const {resolve} = require('path');

// 3rg party dependencies
const arg = require('arg');

const control_panel = require('./controll_panel/index.js');
const loadService = require('./common/service_locator.js');


/**
 * Prints the help info regarding the app usage 
 */
function printHelp(){
  const help = `
  Http manipulator. An easy to use http manupulation system
  Usage: ${argv[0]} [OPTIONS]
  OPTIONS:
    -h | --help : Print usage message
    -c | --config-file : Path of configuration file
  `;
  console.log(help);
}

const args = arg({
	// Types
	'--help': Boolean,
  '-h':'--help',
	'--config_file': String,
  '-c':'--config_file',
  '--config':'--config_file'
});

if(args['--help']){
  printHelp();
  exit(0);
}

const config_file = args['--config_file'] || '/etc/http_manipulator/config.json';
const service = loadService(config_file);

const database = service.get('db');
const config = service.get('config');

const http = http_lib.createHttpServer(service);
http.listen(parseInt(config.http_port)||80);

const ssl_path = config['ssl_path']

const default_cert = resolve(ssl_path,'default.cert')
const default_key = resolve(ssl_path,'default.key')

const https = http_lib.createHttpsServer(service,default_key,default_cert)
const https_port = config['https_port']||443
https.listen(https_port)

const port = parseInt(config.panel_port) || 3000;
control_panel.listen(port,database);