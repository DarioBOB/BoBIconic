const http = require('http');

const data = '[TEST] Ceci est un log de test envoyé au proxy';

const options = {
  hostname: 'localhost',
  port: 3030,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  console.log(`Statut: ${res.statusCode}`);
  res.on('data', d => process.stdout.write(d));
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end(); 