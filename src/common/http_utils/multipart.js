/**
 * Best Effort multipart parser.
 * Body is assumed as multipart/form-data
 * @param {*} body 
 * @param {*} boundary 
 * @param {*} callback 
 */
const parseMultipart = (body,boundary,fieldCallback) => {

    const bodyToParse = body.trim();

    const firstLineBoundary = bodyToParse.substring(2,70).split('\r\n')[0]

    if(typeof boundary == "string"){
        boundary = boundary.trim();
    }

    // If no Boundary provided we can guess the first line as one
    if(boundary !== firstLineBoundary){
        boundary = firstLineBoundary;
    }

    // because a boundary wont start with -- we add it up
    const fields = body.split("--"+boundary);

    let fieldCount=0;

    fields.forEach((item)=>{
        if(item.trim()=='--' || item.trim() == ''){
            return;
        }
        fieldCount++;
        
        console.log("FIELD");
        
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

        console.log("LINE",fieldInfo);
        console.log("CONTENT tYPE",contentTypeLine);
        console.log("NAME",fieldName);
        console.log("FILENAME",filename);
        console.log("DATA",item);
    });

}

module.exports=parseMultipart;