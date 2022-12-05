const fs = require('fs');
const arg = require('arg');
const process = require('process');

const control_panel = require('./controll_panel/index.js');
const https = require('./http.js');
const { exit } = require('process');

function printHelp(){
  const help = `
  Http manipulator. An easy to use http manupulation system
  Usage: ${process.argv[0]} [OPTIONS]
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
  '-c':'--config-file',
});

if(args['--help']){
  printHelp();
  exit(0);
}

const config_file = args['--config_file'] || '/etc/http_manipulator/config.json';

if(!fs.existsSync(config_file)){
  console.error(`Configuration file does not exist ar path ${config_file}`);
  exit(-1);
}

control_panel.listen(3000);