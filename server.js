const http = require('http');
const fs = require('fs');
const path = require('path');

const base = __dirname;

const mime = {
    'html': 'text/html; charset=utf-8',
    'css': 'text/css',
    'js': 'application/javascript',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'json': 'application/json',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf'
};

http.createServer((req, res) => {
    let url = req.url.split('?')[0];
    let filePath = path.join(base, url === '/' ? 'index.html' : url);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.log('Not found:', filePath);
            res.writeHead(404);
            res.end('Not found: ' + url);
        } else {
            const ext = path.extname(filePath).slice(1);
            res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
            res.end(data);
        }
    });
}).listen(3000, () => {
    console.log('Serveur actif sur http://localhost:3000');
    console.log('Dossier servi:', base);
});
