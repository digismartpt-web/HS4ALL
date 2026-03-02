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
    let relativePath = url === '/' ? 'index.html' : url;
    let filePath = path.join(base, relativePath);

    function attemptServe(p, isRetry = false) {
        fs.readFile(p, (err, data) => {
            if (err) {
                // If file not found and we haven't tried adding .html yet
                if (err.code === 'ENOENT' && !isRetry && !path.extname(p)) {
                    return attemptServe(p + '.html', true);
                }
                console.log('Not found:', p);
                res.writeHead(404);
                res.end('Not found: ' + url);
            } else {
                const ext = path.extname(p).slice(1) || 'html';
                res.writeHead(200, { 'Content-Type': mime[ext] || 'text/html' });
                res.end(data);
            }
        });
    }

    attemptServe(filePath);
}).listen(3000, () => {
    console.log('Serveur actif sur http://localhost:3000');
    console.log('Dossier servi:', base);
});
