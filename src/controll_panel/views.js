const nunjunks = require('nunjucks');
const path = require('path');


nunjunks.configure(path.join(__dirname,'/../../views'),{
    autoescape:  true,
});


module.exports = nunjunks;