const connect = require('connect');
const {Buffer} = require("node:buffer");
const busboy = require('busboy');
const fs = require('fs');
const {Readable,PassThrough}= require('stream');

const app = connect();

app.use(function(req,res,next){
    var body = [];

    req.on('data',(data) => body.push(data) );

    req.on('end',() => {
        body = Buffer.concat(body);
        const s = new Readable()    
        
        const filePassthrough = new PassThrough();
        const busboyPassthrough = new PassThrough();

        s.pipe(filePassthrough);
        s.pipe(busboyPassthrough);
        filePassthrough.pipe(fs.createWriteStream('body'));
        
        s.push(body);
        s.push(null);

        let boundary = body.toString().substring(2,70).split('\r\n')[0];
        const detectedHeader = "multipart/form-data; boundary="+boundary
        console.log("DETECTED: ",detectedHeader);
        console.log("HEADER:   ",req.headers['content-type']);
        console.log(detectedHeader == req.headers['content-type']);
        console.log({ headers: req.headers });
        const formData = busboy({ headers: {'content-type':detectedHeader} });

        formData.on('field', (name, val, info) => {
            console.log("FIELD",name,val,info);
        });

        formData.on('file', (name, val, info) => {
            console.log("file",name,val,info);
        });

        formData.on('close', () => {
          console.log("close");
          s.push(null);
        });

        formData.on('error', (error) => {
            console.error(error);
        });

        busboyPassthrough.pipe(formData);

        res.end("hello");
    });
});

app.listen(8091)