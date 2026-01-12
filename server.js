const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json'
};

http.createServer((req, res) => {
    // Resolve o caminho do arquivo solicitado
    let filePath = '.' + (req.url === '/' ? '/index.html' : req.url);
    let ext = path.extname(filePath);
    let contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}).listen(PORT, () => {
    console.log('Servidor rodando em http://localhost:' + PORT);
});

