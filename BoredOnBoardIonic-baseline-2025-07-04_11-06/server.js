const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json()); // Pour parser le JSON des logs

// Création du dossier logs/ si besoin
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
const logFile = path.join(logsDir, 'app.log');

// Endpoint pour recevoir les logs de l'app Angular
app.post('/api/logs', (req, res) => {
  const logEntry = {
    ...req.body,
    receivedAt: new Date().toISOString()
  };
  fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', err => {
    if (err) {
      console.error('[LOGGING] Erreur écriture log:', err);
      return res.status(500).json({ error: 'Erreur écriture log' });
    }
    res.json({ status: 'ok' });
  });
});

// Endpoint pour recevoir les erreurs JS du front
app.post('/log-client-error', (req, res) => {
  const logEntry = {
    type: 'client-error',
    ...req.body,
    receivedAt: new Date().toISOString()
  };
  fs.appendFile(logFile, JSON.stringify(logEntry) + '\n', err => {
    if (err) {
      console.error('[CLIENT ERROR] Erreur écriture log:', err);
      return res.status(500).json({ error: 'Erreur écriture log' });
    }
    res.json({ status: 'ok' });
  });
});

const OPENSKY_CLIENT_ID = 'contact@sunshine-adventures.net-api-client';
const OPENSKY_CLIENT_SECRET = 'TcmsDEEKWgDFfrrcGId4S1Ze8qLy35lL';

let accessToken = null;
let tokenExpiresAt = 0;

// Fonction pour obtenir un token OAuth2
async function getAccessToken() {
  const now = Date.now() / 1000;
  if (accessToken && tokenExpiresAt > now + 60) {
    // Token encore valide
    return accessToken;
  }
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', OPENSKY_CLIENT_ID);
  params.append('client_secret', OPENSKY_CLIENT_SECRET);

  const response = await axios.post('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  accessToken = response.data.access_token;
  tokenExpiresAt = now + response.data.expires_in;
  return accessToken;
}

// Proxy pour toutes les requêtes vers OpenSky
app.use('/api/opensky', async (req, res) => {
  try {
    console.log(`[PROXY] Entrant: ${req.method} ${req.originalUrl}`);
    const token = await getAccessToken();
    const openskyUrl = 'https://opensky-network.org/api' + req.originalUrl.replace('/api/opensky', '');
    console.log(`[PROXY] Forward vers: ${openskyUrl}`);
    const response = await axios.get(openskyUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`[PROXY] Réponse OpenSky: ${response.status} ${openskyUrl}`);
    // Traitement spécial pour /tracks/all : limiter la taille de la trajectoire pour debug
    if (req.path.startsWith('/api/tracks/all') && response.data && Array.isArray(response.data.path)) {
      // Limite à 20 points pour debug
      if (response.data.path.length > 20) {
        response.data.path = response.data.path.slice(0, 20);
      }
      console.log('Envoi trajectoire à l\'UI, points:', response.data.path.length);
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      console.error(`[PROXY] Erreur OpenSky: ${err.response.status} ${req.originalUrl} - ${JSON.stringify(err.response.data)}`);
      res.status(err.response.status).json({ error: err.response.data || err.message });
    } else {
      console.error(`[PROXY] Erreur serveur: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  }
});

app.listen(3000, () => console.log('Proxy OpenSky OAuth2 lancé sur http://localhost:3000'));