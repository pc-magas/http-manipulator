const control_panel = require('./controll_panel/index.js');

control_panel.listen(3000);

setInterval(function(){
    control_panel.event.emit("http",{data:"Hello"});
},3000);