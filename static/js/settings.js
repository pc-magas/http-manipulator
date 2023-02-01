$(function(){

    $("#http_method").on('change',function(event){
        const source = event.target || event.srcElement;
        const http_method = $(source).val();
        console.log(http_method.length,Array.isArray(http_method) ,http_method[0] )
        if( (Array.isArray(http_method) && (http_method.length > 1 || (http_method.length == 1 && http_method[0] != 'GET')))
            || (typeof string == 'string' &&  http_method != 'GET')
        ){
            console.log("Here");
            $("#status").val('308');
        }
    });
});