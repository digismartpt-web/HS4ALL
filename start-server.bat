@echo off
echo Demarrage du serveur local sur http://localhost:3000
echo Ne fermez pas cette fenetre !
node -e "const http=require('http'),fs=require('fs'),path=require('path');const base=__dirname;http.createServer((req,res)=>{let url=req.url.split('?')[0];let f=path.join(base,url==='/'?'/index.html':url);const ext=path.extname(f).slice(1);const mime={'html':'text/html','css':'text/css','js':'application/javascript','png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg','gif':'image/gif','svg':'image/svg+xml','ico':'image/x-icon','mp3':'audio/mpeg','wav':'audio/wav','json':'application/json','woff':'font/woff','woff2':'font/woff2','ttf':'font/ttf'};fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);res.end('Not found: '+f)}else{res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream'});res.end(d)}})}).listen(3000,()=>console.log('Serveur actif sur http://localhost:3000'))"
pause
