const http = require('http');
const fs = require('fs');
const LOG_FILE = 'logs/app.log';

if (!fs.existsSync('logs')) fs.mkdirSync('logs');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log('[LOG-PROXY] POST reçu:', body);
      try {
        fs.appendFileSync(LOG_FILE, body + '\n');
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('ERROR');
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
  }
});

server.listen(3030, () => {
  console.log('Log proxy listening on http://localhost:3030');
}); 