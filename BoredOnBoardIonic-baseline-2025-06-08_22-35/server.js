const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

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
    const token = await getAccessToken();
    const openskyUrl = 'https://opensky-network.org' + req.originalUrl.replace('/api/opensky', '');
    const response = await axios.get(openskyUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
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
      res.status(err.response.status).json({ error: err.response.data || err.message });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.listen(3000, () => console.log('Proxy OpenSky OAuth2 lancé sur http://localhost:3000'));