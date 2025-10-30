const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './app/page.tsx';
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm',
    '.tsx': 'text/plain',
    '.ts': 'text/plain'
  };
  
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <head><title>InfoMapper - Serwer HTTP</title></head>
            <body>
              <h1>🚀 InfoMapper - Serwer HTTP działa!</h1>
              <p>Serwer uruchomiony na porcie 8080</p>
              <p>Plik: ${filePath} nie został znaleziony</p>
              <p>Dostępne pliki:</p>
              <ul>
                <li><a href="/app/page.tsx">app/page.tsx</a></li>
                <li><a href="/package.json">package.json</a></li>
                <li><a href="/public/placeholder-logo.png">Logo</a></li>
              </ul>
            </body>
          </html>
        `);
      } else {
        res.writeHead(500);
        res.end('Błąd serwera: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`🚀 Serwer HTTP uruchomiony na http://localhost:${PORT}`);
  console.log('Naciśnij Ctrl+C aby zatrzymać serwer');
});











