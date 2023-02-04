(function( $ ) {
    $.fn.httpRedirect = function() {

        console.log( this.get(0).tagName);
        if(
            this.get(0).tagName.toLowerCase() != 'select' 
        ){
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
 
}( jQuery ));
 