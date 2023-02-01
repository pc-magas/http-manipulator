$(function(){

    $("#http_method").on('change',function(event){
        const source = event.target || event.srcElement;
        const http_method = $(source).val();

        if(http_method != 'GET'){
            $("#status").val('308');
        }
    });
});