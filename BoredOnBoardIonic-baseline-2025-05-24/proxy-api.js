const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const AVIATIONSTACK_KEY = process.env.AVIATIONSTACK_KEY;

app.get('/api/flight', async (req, res) => {
  const { flight_iata } = req.query;
  if (!flight_iata) return res.status(400).json({ error: 'Missing flight_iata param' });

  try {
    const response = await axios.get(
      `http://api.aviationstack.com/v1/flights?access_key=${AVIATIONSTACK_KEY}&flight_iata=${flight_iata}`
    );
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Erreur proxy AviationStack', details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy API running on http://localhost:${PORT}`));