const {createDb} = require('../src/common/db');

const path = require('path');

const db = createDb(path.join(__dirname,'db.sqlite'));

