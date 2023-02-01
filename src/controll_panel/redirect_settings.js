const nunjunks = require('./views');
const {getBaseUrl} = require('../http_utils');


const router = function (app) {
    app.get('/settings',function(req,res){
        const url = http_utils.getBaseUrl(req);
        console.log(url);
        res.setHeader('Location', url+'settings/redirect/https')

    });

    app.get('/settings/redirect/https',function(req,res){
        nunjunks.render('./settings/redirect_https.njk', {
            title:'Basir reficrection from http to Https',
            js: [],
            baseUrl: getBaseUrl(req)
        },(err,response)=>{
            console.error(err);
            res.end(response);
        })
    })

    app.get('/settings/redirect/advanced',function(req,res){
        nunjunks.render('./settings/redirect_advanced.njk', {
            title:'Advanced redirection to any url',
            js: [],
            baseUrl: getBaseUrl(req)
        },(err,response)=>{
            console.error(err);
            res.end(response);
        })
    })

    app.post('/settings/redirect/advanced',function(req,res){
        
    });
};


module.exports = router;