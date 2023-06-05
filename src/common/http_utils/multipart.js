/**
 * Best Effort multipart parser.
 * Body is assumed as multipart/form-data
 * @param {*} body 
 * @param {*} boundary 
 * @param {*} callback 
 */
const parseMultipart = (body,boundary) => {

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
        console.log(item);
    });

}

module.exports=parseMultipart;