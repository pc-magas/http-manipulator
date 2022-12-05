// Nodejs Dependencies
const { exit, argv } = require('process');
const fs = require('fs');

// 3rg party dependencies
const arg = require('arg');

const control_panel = require('./controll_panel/index.js');
const configLoader = require('./config.js')
const https = require('./http.js');

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
  '-c':'--config-file',
});

if(args['--help']){
  printHelp();
  exit(0);
}

const config_file = args['--config_file'] || '/etc/http_manipulator/config.json';
const config = configLoader(config_file);

control_panel.listen(parseInt(config.panel_port) || 3000);