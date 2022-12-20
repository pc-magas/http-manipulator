const http = require('node:http');
const server = http.createServer((req,res)=>{
    const url = "https://reqres.in/api/users?page=2"
    res.setHeader('location', url);
    res.writeHead(301)
    res.end()
});

server.listen(8080);