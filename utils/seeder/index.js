
const { exit, argv } = require('process');

const db = require('../../src/db.js');
const configLoader = require('../../src/config.js')
const seeds = require('./seeds.js');

const args_num = process.argv.slice(2).length;

function pargeArgs(){

    const help=`
    Run either:
    * For specific seeders (arguments are case sensitive):
        ${argv[0]} seeder1 seeder2 seeder3
    * For all seeders (argument is not case sensitive):
        ${argv[0]} all
    `;

    if(args_num == 0){
        console.error("You must provide seeders to be run");
        console.log(help)
        exit(-1);
    }

    const arg = require('arg');

    const args = arg({
        // Types
        '--help': Boolean,
        '--config_file': [String],
        '-c':'--config_file',
        '--config':'--config_file',
        '-h':'--help',
    });

    if(args['--help']){
        console.log(help);
        exit(0);
    }

    return {
        config_path: args['--config_file'].pop() || null,
        seeders: args._
    }
}


const args = pargeArgs();

const config = configLoader(args.config_path);
const db_path = config.local_db || '/etc/http_manipulator/db.sqlite';
console.log(`Loading database ${db_path}`)
const database = db(db_path);

let seeds_to_run=args.seeders;

if(seeds_to_run.pop().trim().toLowerCase()=='all'){
    seeds_to_run=Object.keys(seeds);
}

seeds_to_run.forEach((item)=>{
    process.stdout.write(`RUNNING \x1b[36m${item}\x1b[0m......`)

    if(!seeds[item]){
        process.stdout.write("[\x1b[31mMISSING\x1b[0m]\n")
        return;
    }
    
    seeds[item](database,function(error){
        if(!error){
            process.stdout.write("[\x1b[32mSUCCESS\x1b[0m] \n")            
            return;
        }
        
        process.stdout.write("[\x1b[31mERROR\x1b[0m] \n")
        console.log();
        console.error("#".repeat(5));
        console.error(`ERROR on Seeder \x1b[36m${item}\x1b[0m`);
        console.error(error);
        console.error("#".repeat(5));
        process.exit(-1);
    });
})




