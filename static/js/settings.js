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
            $(this).val('308');
        }
        return this;
    }

    $.fn.onSubmitAjax = function(success,fail,always){

        if(this.get(0).tagName.toLowerCase() != 'form'){
            return this;
        }

        $(this).on('submit',function(e){
            e.preventDefault();
            const request = $.ajax({
                "action": $(this).attr('action'),
                "method": $(this).attr('method'),
                "data": $(this).serialize(),
                "done": success,
                "fail":fail,
                "always":always
            });

            request.done(success);
            request.fail(fail);
            request.always(always);
        });
    }
 
    
    $.fn.displayMsg=function(msg,error){
        console.log( this.get(0).tagName);
        if(
            this.get(0).tagName.toLowerCase() != 'div'
            && this.get(0).tagName.toLowerCase() != 'section'
        ){
            return this;
        }


        const element = document.createElement('div');
        element.textContent = msg;
        element.setAttribute('role','alert');

        const dismissBtn = document.createElement('button');
        dismissBtn.classList.add('btn-close');
        dismissBtn.setAttribute('data-bs-dismiss','alert');
        dismissBtn.setAttribute('aria-label','Close');

        element.classList.add( "alert", "alert-dismissible", "fade" ,"show");
        element.classList.add(error?"alert-danger":"alert-success");
        element.append(dismissBtn); 
        console.log(element);

        this.append(element);

        setTimeout(()=>{
            $(element).alert('close');
        },2000);
    }

}( jQuery ));


