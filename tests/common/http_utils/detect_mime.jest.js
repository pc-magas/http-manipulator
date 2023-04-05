const fs = require('node:fs');
const path = require('path');

const {detectBodyMime} = require('../../../src/common/http_utils.js');

const fileDataPath = path.resolve(__dirname,'__testdata__');

test("detectsBase64EncodedImage",(done)=>{
    const imgdata = path.resolve(fileDataPath,"img.jpeg.base64");
    const content = fs.readFileSync(imgdata);
    
    detectBodyMime(content.toString(),(err,mime,extention)=>{
        expect(mime).toBe('image/jpeg');
        expect(extention).toBe('jpg');
        expect(err).toBe(null);

        done();
    });
});

test("detectsBase64EncodedJson",(done)=>{
    const content =  Buffer.from("{\"param\":1}", 'utf8');
    
    detectBodyMime(content.toString('base64'),(err,mime,extention)=>{
        expect(mime).toBe('image/jpeg');
        expect(extention).toBe('jpg');
        expect(err).toBe(null);

        done();
    });
});


test("detectsJson",(done)=>{
    const content = "{\"param\":1}";
    
    detectBodyMime(content.toString('base64'),(err,mime,extention)=>{
        expect(mime).toBe('image/jpeg');
        expect(extention).toBe('jpg');
        expect(err).toBe(null);

        done();
    });
});