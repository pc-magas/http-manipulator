$(document).ready(function(){
    let base = document.getElementsByTagName('base')[0].href;
    /**
     * In case of https the result will be wss as standart specifies:
     * Both http and https have "http" as common part.
     */
    base = base.replace('http','ws');

    console.log(base)
    const socket = new WebSocket(base);

    socket.addEventListener('open', (event) => {
        console.log("Hello");
    });
    
    // Listen for messages
    socket.addEventListener('message', (event) => {
        console.log('Message from server ', event.data);
    });
    
});