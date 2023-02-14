const nunjunks = require('../views');
const {getBaseUrl} = require('../../common/http_utils.js');
const {saveRedirectHttps} = require('../models/redirect_model');
var {urlencoded} = require('express')

const router = function (db,app) {
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

    app.post('/settings/redirect/https',function(req,res){
        
        console.log(req.body);
        try{
            saveRedirectHttps(db,req.body.base_url,req.body.http_method,req.body.http_status);
            res.send(204);
        } catch(err){
            console.error(err);
            res.send(500);
        }
    });
};


module.exports = router;