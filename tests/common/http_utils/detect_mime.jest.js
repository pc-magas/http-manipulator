const fs = require('node:fs');
const path = require('path');

const {detectBodyMime} = require('../../../src/common/http_utils.js');

const fileDataPath = path.resolve(__dirname,'__testdata__');

test("detectsBase64EncodedImage",(done)=>{
    const imgdata = path.resolve(fileDataPath,"img.jpeg.base64");
    const content = fs.readFileSync(imgdata);
    
    detectBodyMime(content.toString(),(err,mime,extention)=>{
        expect(mime).toBe('image/jpeg');
        expect(extention).toBe('jpeg');
        expect(err).toBe(null);

        done();
    });
});

test("detectsBase64EncodedImagePng",(done)=>{
    const imgdata = path.resolve(fileDataPath,"img.png.base64");
    const content = fs.readFileSync(imgdata);
    
    detectBodyMime(content.toString(),(err,mime,extention)=>{
        expect(mime).toBe('image/png');
        expect(extention).toBe('png');
        expect(err).toBe(null);

        done();
    });
});

test("detectsBase64EncodedJson",(done)=>{
    const content =  Buffer.from("{\"param\":1}", 'utf8');
    
    detectBodyMime(content.toString('base64'),(err,mime,extention)=>{
        expect(mime).toBe('application/json');
        expect(extention).toBe('json');
        expect(err).toBe(null);

        done();
    });
});


test("detectsJson",(done)=>{
    const content = "{\"param\":1}";
    
    detectBodyMime(content,(err,mime,extention)=>{
        expect(mime).toBe('application/json');
        expect(extention).toBe('json');
        expect(err).toBe(null);

        done();
    });
});

test("detectsXml",(done)=>{
    const content = `<?xml version="1.0" encoding="UTF-8"?>
    <note>
      <to>Tove</to>
      <from>Jani</from>
      <heading>Reminder</heading>
      <body>Don't forget me this weekend!</body>
    </note>
    `;

    detectBodyMime(content,(err,mime,extention)=>{
        expect(['application/xml','text/xml']).toContain(mime);
        expect(extention).toBe('xml');
        expect(err).toBe(null);

        done();
    });
})

test("detectsXmlBase64 encoded",(done)=>{
    const content = `<?xml version="1.0" encoding="UTF-8"?>
    <note>
      <to>Tove</to>
      <from>Jani</from>
      <heading>Reminder</heading>
      <body>Don't forget me this weekend!</body>
    </note>
    `;

    const base64EncodedXml = Buffer.from(content).toString('base64');

    detectBodyMime(base64EncodedXml,(err,mime,extention)=>{
        expect(['application/xml','text/xml']).toContain(mime);
        expect(extention).toBe('xml');
        expect(err).toBe(null);

        done();
    });
})

