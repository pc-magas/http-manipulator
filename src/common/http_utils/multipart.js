
const detectBodyMime = require('./body');

const FLAG_MIME_TYPE_MISMATCH='FLAG_MIME_TYPE_MISMATCH';
const FLAG_BOUNDARY_FIRST_LINE='FLAG_BOUNDARY_FIRST_LINE';
const FLAG_BOUNDARY_MISMATCH = 'FLAG_BOUNDARY_MISMATCH';
const FLAG_NO_FIELDS = 'FLAG_NO_FIELDS';

module.exports.flags= {
    FLAG_MIME_TYPE_MISMATCH,
    FLAG_BOUNDARY_FIRST_LINE,
    FLAG_BOUNDARY_MISMATCH,
    FLAG_NO_FIELDS,
};

/**
 * Best Effort multipart parser.
 * Body is assumed as multipart/form-data
 * @param {*} body 
 * @param {*} boundary 
 * @param {Function} fieldCallback
 * @param {Function}  completeCallback
 */
const parseMultipart = (body,boundary,fieldCallback,completeCallback) => {

    if(Buffer.isBuffer(body)){
        body = body.toString();
    }
    const bodyToParse = body.trim();

    const flags = []

    const firstLineBoundary = bodyToParse.substring(2,70).split('\r\n')[0]

    if(!boundary){
        boundary = firstLineBoundary;
        flags.push(FLAG_BOUNDARY_FIRST_LINE);
    } else if(typeof boundary == "string") {
        boundary = boundary.trim();
    } 

    // If no Boundary provided we can guess the first line as one
    if(boundary !== firstLineBoundary){
        boundary = firstLineBoundary;
        flags.push(FLAG_BOUNDARY_FIRST_LINE);
        flags.push(FLAG_BOUNDARY_MISMATCH);
    }

    // because a boundary wont start with -- we add it up
    const fields = body.split("--"+boundary);

    let fieldCount=0;

    for (const fieldItem of fields) {
        let item = fieldItem;
        const fieldFlags=[];

        if(item.trim()=='--' || item.trim() == ''){
            return;
        }
        fieldCount++;
                
        item = item.trim();

        const newlinePos = item.search('\r\n');
        let fieldInfo = item.substring(0,newlinePos).trim(); 
        
        item = item.substring(newlinePos).trim();
        
        let contentTypeLine = null;

        const contentTypePosStart = item.search("Content-Type");

        if(contentTypePosStart >= 0){
            const contentTypeNewLinePos = item.indexOf('\r\n',contentTypePosStart);

            contentTypeLine=item.substring(contentTypePosStart,contentTypeNewLinePos).trim();
            item=item.substring(contentTypeNewLinePos);

            contentTypeLine=contentTypeLine.replace('Content-Type: ','').trim();
        }

        item = item.trim();

        fieldInfo = fieldInfo.replace("Content-Disposition: form-data; ",'').trim();
        
        const isFile = fieldInfo.indexOf('; filename=') > 0;

        fieldInfo = fieldInfo.split(';');

        const fieldName = fieldInfo[0].replace("name=\"",'').replace(/\"$/,"");
        let filename = (isFile)?fieldInfo[1].replace('filename="',"").replace(/\"$/,"").trim():null; 

         /**
         * item: data
         * contentTypeLine: contentType mime
         * Field Values: fieldInfo
         * Filename:  filename
         * FieldName: fieldName
         */ 

         if(isFile){
            detectBodyMime(item,(error,detectedMime)=>{

                if(detectedMime != contentTypeLine){
                    fieldFlags.push(FLAG_MIME_TYPE_MISMATCH);
                }

                fieldCallback(error,fieldName,item,isFile,filename,detectedMime,contentTypeLine,fieldFlags);
            });
         } else {
            fieldCallback(null,fieldName,item,isFile,filename,null,null,fieldFlags);
         }
    }

    if(fieldCount==0){
        flags.push(FLAG_NO_FIELDS);
    }

    completeCallback(fieldCount,flags);
}

module.exports.parseMultipart=parseMultipart;
