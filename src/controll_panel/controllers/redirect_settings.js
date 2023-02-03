const nunjunks = require('../views');
const {getBaseUrl} = require('../../common/http_utils.js');


const router = function (app) {
    app.get('/settings/redirect/https',function(req,res){
        nunjunks.render('./settings/redirect_https.njk', {
            title:'Basic redicrection from Http to Https',
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