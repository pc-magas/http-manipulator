$(function(){
    $(".page_link").on('click',function(e){
        e.preventDefault();
        const source = e.target || e.srcElement;
        const pageId = $(source).attr('href');
        console.log("Here");
        showPage(pageId);
    });
});

function showPage(id){
    const children = $(id).parent().children(".page");
    children.each((i,elem)=>$(elem).attr('data-active',false));
    $(id).attr('data-active',true);
}