$(function(){
    $(".tab_link").on('click',function(e){
        e.preventDefault();
        $(this).tab('show');
    });
});