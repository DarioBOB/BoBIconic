const CDP = require('chrome-remote-interface');
const fs  = require('fs');
const path = require('path');

// Capture des logs navigateur désactivée car source de conflits de port (3040)
// Ancien code désactivé :
// ... (tout le code de capture ou d'écoute sur 3040 doit être commenté ou supprimé)

(async () => {
  const client = await CDP({ port: 9222 });
  const { Runtime } = client;
  await Runtime.enable();
  Runtime.consoleAPICalled(params => {
    const msg = params.args.map(a => a.value).join(' ');
    const ligne = `[${new Date().toISOString()}] ${params.type}: ${msg}\n`;
    const logsDir = path.join(__dirname, 'logs');
    const logFile = path.join(logsDir, 'console.log');
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    fs.appendFileSync(logFile, ligne);
  });
  console.log('[CDP] Capture des logs navigateur démarrée (logs/console.log)');
})(); 