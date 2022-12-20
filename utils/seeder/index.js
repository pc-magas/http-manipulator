const db = require('../../src/db.js');
const configLoader = require('../../src/config.js')
const seeder = require('./seeds.js');

const config = configLoader();
const db_path = config.local_db || '/etc/http_manipulator/db.sqlite';
const database = db(db_path);

let args = process.argv.slice(2);

const help=`
Run either:
 * For specific seeders (arguments are case sensitive):
    ${process.argv[0]} seeder1 seeder2 seeder3
 * For all seeders (argument is not case sensitive):
    ${process.argv[0]} all
`;

if(args.count == 0){
    console.error("You must provide seeders to be run");
    console.log(help)
    process.exit(-1);
}


args.forEach((item)=>{
    process.stdout.write(`RUNNING \x1b[36m${item}\x1b[0m......`)

    if(!seeder[item]){
        process.stdout.write("[\x1b[31mMISSING\x1b[0m ]\n")
        return;
    }
    
    seeder[item](database,function(error){
        if(!error){
            process.stdout.write("[\x1b[32m SUCCESS\x1b[0m ] \n")            
            return;
        }
        
        process.stdout.write("[\x1b[31m ERROR\x1b[0m ] \n")
        console.log();
        console.error("#".repeat(5));
        console.error(`ERROR on Seeder \x1b[36m${item}\x1b[0m`);
        console.error(error);
        console.error("#".repeat(5));
        process.exit(-1);
    });
})




