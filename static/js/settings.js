(function( $ ) {
    $.fn.httpRedirect = function() {

        if(this.get(0).tagName.toLowerCase() != 'select'){
            return this;
        }

        const http_status = [
            {
                status:301,
                desc: "Moved Permanently"
            },
            {
                status: 302,
                desc: "Temporary Redirect"
            },
            {
                status: 303,
                desc: "See other"
            },
            {
                status: 304,
                desc: "Not Modified"
            },
            {
                status: 307,
                desc: "Temporary Redirect"
            },
            {
                status: 308,
                desc: "Permanent Redirect"
            }
        ];

        console.log(this);
        http_status.forEach((val) => {
            const element = document.createElement("option");
            element.setAttribute("value",val.status);
            element.text = val.status+" "+val.desc
            this.append(element);
        });

        return this; 
    };

    $.fn.setHttpStatusBasedOnHttpMethod = function(http_method){
        if(this.get(0).tagName.toLowerCase() != 'select'){
            return this;
        }

        if( (Array.isArray(http_method) && (http_method.length > 1 || (http_method.length == 1 && http_method[0] != 'GET')))
            || (typeof string == 'string' &&  http_method != 'GET')
        ){
            console.log("Here");
            $(this).val('308');
        }
        return this;
    }
 
}( jQuery ));
 