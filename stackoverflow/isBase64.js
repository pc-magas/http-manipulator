
const connect = require('connect');

const base64RegExp = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{4})$/;
const isBase64 = (str) => {
    const cleanedStr = str.replace(/[\n\r\s]+/g, '');
    return base64RegExp.test(cleanedStr);
};
  
const app = connect();


app.use(function(req,res,next){
     
    var body = [];

    req.on('data',(data) =>
    {
        console.log('Getting Body');
        body.push(data)
    });

    req.on('end',() => {
        body = Buffer.concat(body).toString();
        
        res.setHeader("Content-Type",'text/plain');
        res.writeHead(200);

        let containsNewline = body.indexOf("\n")==-1?"String Contains new line":"String does not contain new line";

        let containsNewlinefilter = body.replace("\n","").replace("\r","").indexOf("\n") == -1?"New Lines Removed":"NewLines Has not removed"

        if(isBase64(body)){
            res.end("BOdy base64 encoded\n"+containsNewline+"\n"+containsNewlinefilter+"\n");
        } else {
            res.end("BOdy not base64 encoded\n"+containsNewline+"\n"+containsNewlinefilter+"\n");
        }
      
    });
});

app.listen(8090);