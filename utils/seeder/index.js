const db = require('../../src/db.js');
const configLoader = require('../../src/config.js')
const seeds = require('./seeds.js');

const config = configLoader();
const db_path = config.local_db || '/etc/http_manipulator/db.sqlite';
const database = db(db_path);

let args = process.argv.slice(2);
let seeds_to_run=args;
const args_num = args.length;

const help=`
Run either:
 * For specific seeders (arguments are case sensitive):
    ${process.argv[0]} seeder1 seeder2 seeder3
 * For all seeders (argument is not case sensitive):
    ${process.argv[0]} all
`;

if(args_num == 0){
    console.error("You must provide seeders to be run");
    console.log(help)
    process.exit(-1);
}else if(args_num > 0 && args.pop().trim().toLowerCase()=='all'){
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




