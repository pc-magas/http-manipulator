const fs = require('fs');
const path = require('path');
const {parseMultipart,flags} = require('../../../src/common/http_utils/multipart.js');

const fileDataPath = path.resolve(__dirname,'__testdata__');

test("parse Multipart File",(done)=>{
    const httpBodyFile = path.resolve(fileDataPath,"bodyWithFileUpload");
    const content = fs.readFileSync(httpBodyFile);
    let fileContent = fs.readFileSync( path.resolve(fileDataPath,"img.png.base64")).toString();

    const detectFields = (err,fieldName,value,isFile,filename,detectedMime,inputMime,field_flags) => {

        if(err){
            done(err);
        }

        expect(['key1','value']).toContain(fieldName);

        if(fieldName=='key1'){
            expect(isFile).toBe(false);
            expect(value).toBe('value1');

            // I do not care what filename Is therefore I do not test it

            // But I care for mime types
            expect(detectedMime).toBe(null);
            expect(inputMime).toBe(null);
            
        }else if(fieldName == 'value'){
            expect(isFile).toBe(true);
            value = value.trim().replace("\n","");
            fileContent = fileContent.trim().replace("\n","");
            expect(value).toBe(fileContent);

            expect(field_flags).toContain(flags.FLAG_MIME_TYPE_MISMATCH)
        }
        
    };

    const completeCallback = (fieldCount,receivedFlags) =>{

        expect(fieldCount).toBe(2);
        expect(receivedFlags.length).toBe(1)
        expect(flags.FLAG_BOUNDARY_FIRST_LINE).toBe(receivedFlags.pop());

        done();
    };

    parseMultipart(content,null,detectFields,completeCallback);
    
});