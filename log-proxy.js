const http = require('http');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Utiliser un chemin absolu basé sur le répertoire du script
const scriptDir = __dirname;
const LOG_FILE = path.join(scriptDir, 'logs', 'app.log');
const logsDir = path.join(scriptDir, 'logs');

// Créer le dossier logs s'il n'existe pas
if (!fsSync.existsSync(logsDir)) {
  fsSync.mkdirSync(logsDir, { recursive: true });
}

// Fonction pour écrire dans le log avec retry et gestion d'erreurs
async function writeToLog(data) {
  const maxRetries = 3;
  const retryDelay = 100; // 100ms entre les tentatives
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await fs.appendFile(LOG_FILE, data + '\n');
      return true; // Succès
    } catch (err) {
      console.error(`[LOG-PROXY] Tentative ${attempt}/${maxRetries} - Erreur d'écriture:`, err.message);
      
      if (err.code === 'EBUSY' || err.code === 'EACCES') {
        // Fichier verrouillé ou accès refusé - attendre et réessayer
        if (attempt < maxRetries) {
          console.log(`[LOG-PROXY] Attente de ${retryDelay}ms avant nouvelle tentative...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
      }
      
      // Autres erreurs ou échec après tous les essais
      console.error('[LOG-PROXY] Échec définitif de l\'écriture du log:', err);
      return false;
    }
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  try {
    console.log('[LOG-PROXY] Nouvelle requête:', req.method, req.url);
    
    // Headers CORS
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
      
      req.on('data', chunk => { 
        body += chunk; 
      });
      
      req.on('end', async () => {
        console.log('[LOG-PROXY] POST reçu, taille:', body.length);
        
        try {
          const success = await writeToLog(body);
          
          if (success) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
          } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('ERROR: Impossible d\'écrire dans le fichier de log');
          }
        } catch (err) {
          console.error('[LOG-PROXY] Erreur lors de l\'écriture:', err);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('ERROR: ' + err.message);
        }
      });
      
      req.on('error', (err) => {
        console.error('[LOG-PROXY] Erreur de réception du body:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('ERROR: ' + err.message);
      });
    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain' });
      res.end('Method Not Allowed');
    }
  } catch (err) {
    console.error('[LOG-PROXY] Exception globale:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('ERROR: ' + err.message);
  }
});

server.listen(3040, '0.0.0.0', () => {
  console.log('Log proxy listening on http://0.0.0.0:3040 (toutes interfaces)');
  console.log('[LOG-PROXY] Version améliorée avec gestion robuste des erreurs de fichiers');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('[LOG-PROXY] ERREUR : Le port 3040 est déjà utilisé. Vérifiez qu\'aucun autre log-proxy ou service n\'est lancé sur ce port.');
    process.exit(1);
  } else {
    console.error('[LOG-PROXY] Erreur serveur inattendue :', err);
    process.exit(1);
  }
});
