const db = require('../../src/db.js');
const config = require('../../src/db.js');
const seeder = require('./seeds.js');

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
    exit(-1);
}


args.forEach((item)=>{
    let success = false;
    process.stdout.write(`RUNNING ${item}......`)
    if(!seeder[item]){
        process.stdout.write("[\x1b[32mMISSING\x1b[0m ]\n")
        success||=false;
        return;
    }
    seeder[item](database);
    process.stdout.write("[\x1b[31m SUCCESS\x1b[0m ] \n")
});