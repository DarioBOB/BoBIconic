const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { parseEmails, getEmailStats } = require('./email-parser/index.js');

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

// Endpoint pour obtenir le fuseau horaire IANA via OpenAI
app.post('/api/get-timezone', async (req, res) => {
  const { city, iata } = req.body;
  if (!city && !iata) {
    return res.status(400).json({ error: 'city or iata required' });
  }
  const prompt = city
    ? `Quel est le fuseau horaire IANA (ex: Europe/Zurich) pour la ville suivante : ${city} ? Donne uniquement l'identifiant IANA, rien d'autre.`
    : `Quel est le fuseau horaire IANA (ex: Europe/Zurich) pour l'aéroport de code IATA ${iata} ? Donne uniquement l'identifiant IANA, rien d'autre.`;

  // Charge la clé OpenAI depuis l'environnement sécurisé
  let openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    try {
      const env = require('./src/environments/environment');
      openaiApiKey = env.environment.openaiApiKey;
    } catch (e) {
      return res.status(500).json({ error: 'Clé OpenAI manquante' });
    }
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Tu es un assistant pour la géolocalisation et les fuseaux horaires.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 20,
      temperature: 0
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    // On attend une réponse du type "Europe/Zurich"
    const answer = response.data.choices[0].message.content.trim().split(/[\s\n]/)[0];
    res.json({ timezone: answer });
  } catch (err) {
    console.error('[OpenAI] Erreur:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur OpenAI', details: err.response?.data || err.message });
  }
});

// Endpoint pour obtenir le fuseau horaire abrégé via OpenAI (format humain)
app.post('/api/gpt-timezone', async (req, res) => {
  const { city, date } = req.body;
  if (!city || !date) {
    return res.status(400).json({ error: 'city et date requis' });
  }
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString('fr-FR', { month: 'long' });
  const year = d.getFullYear();
  const prompt = `Donne-moi le fuseau horaire de ${city} le ${day} ${month} ${year} au format\n${city} ${day} ${month} ${year} = <abréviation> (UTC ± offset)`;

  // Charge la clé OpenAI depuis l'environnement sécurisé
  let openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    try {
      const env = require('./src/environments/environment');
      openaiApiKey = env.environment.openaiApiKey;
    } catch (e) {
      return res.status(500).json({ error: 'Clé OpenAI manquante' });
    }
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'Tu es un assistant pour la géolocalisation et les fuseaux horaires.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 40,
      temperature: 0
    }, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    // On attend une réponse du type "Genève 6 juillet 2025 = CEST (UTC +2)"
    const answer = response.data.choices[0].message.content.trim();
    res.json({ text: answer });
  } catch (err) {
    console.error('[OpenAI] Erreur:', err.response?.data || err.message);
    res.status(500).json({ error: 'Erreur OpenAI', details: err.response?.data || err.message });
  }
});

// Endpoints pour le parsing d'emails
app.post('/api/parse-mails', async (req, res) => {
  try {
    console.log('[EMAIL PARSER] Démarrage du parsing des emails...');
    const result = await parseEmails();
    console.log('[EMAIL PARSER] Parsing terminé:', result);
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[EMAIL PARSER] Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/email-stats', async (req, res) => {
  try {
    console.log('[EMAIL PARSER] Récupération des statistiques...');
    const stats = await getEmailStats();
    res.json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('[EMAIL PARSER] Erreur stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/parsed-bookings', async (req, res) => {
  try {
    const { type, provider, search } = req.query;
    console.log('[EMAIL PARSER] Récupération des réservations:', { type, provider, search });
    
    let bookings = [];
    if (type) {
      bookings = await getEmailStats().then(stats => 
        stats.recentBookings.filter(b => b.booking_type === type)
      );
    } else if (provider) {
      bookings = await getEmailStats().then(stats => 
        stats.recentBookings.filter(b => 
          b.provider.toLowerCase().includes(provider.toLowerCase())
        )
      );
    } else if (search) {
      bookings = await getEmailStats().then(stats => 
        stats.recentBookings.filter(b => 
          b.name?.toLowerCase().includes(search.toLowerCase()) ||
          b.location?.toLowerCase().includes(search.toLowerCase()) ||
          b.provider.toLowerCase().includes(search.toLowerCase())
        )
      );
    } else {
      const stats = await getEmailStats();
      bookings = stats.recentBookings;
    }
    
    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('[EMAIL PARSER] Erreur récupération réservations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(3000, () => console.log('Proxy OpenSky OAuth2 et Email Parser lancé sur http://localhost:3000'));