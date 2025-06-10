const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Route pour récupérer les voyages d'un utilisateur
app.get('/api/trips/:userId', async (req, res) => {
  try {
    // Données de test
    const trips = [
      {
        id: '5MQoxLtzDrDVdN9F64FB',
        userId: req.params.userId,
        title: 'Voyage à Bruxelles',
        startDate: '2025-06-05T14:10:00.000Z',
        endDate: '2025-06-08T15:30:00.000Z',
        status: 'active',
        plans: [
          {
            id: '9rkyDgdlCZL6iuklRK8t',
            type: 'flight',
            title: 'Vol de Genève à Bruxelles',
            startDate: '2025-06-05T14:10:00.000Z',
            endDate: '2025-06-05T15:30:00.000Z',
            details: {
              flight: {
                flight_number: 'EZS1529',
                airline: 'easyJet',
                departure: {
                  airport: 'GVA',
                  terminal: '1',
                  gate: 'A12'
                },
                arrival: {
                  airport: 'BRU',
                  terminal: '1',
                  gate: 'B45'
                }
              }
            }
          },
          {
            id: '7tDO36lqB3556pN85ZBT',
            type: 'flight',
            title: 'Vol de Bruxelles à Genève',
            startDate: '2025-06-08T14:10:00.000Z',
            endDate: '2025-06-08T15:30:00.000Z',
            details: {
              flight: {
                flight_number: 'EZS1528',
                airline: 'easyJet',
                departure: {
                  airport: 'BRU',
                  terminal: '1',
                  gate: 'B45'
                },
                arrival: {
                  airport: 'GVA',
                  terminal: '1',
                  gate: 'A12'
                }
              }
            }
          },
          {
            id: 'aTeRbf6GGepAvlKlwEge',
            type: 'car_rental',
            title: 'Location de voiture à Bruxelles',
            startDate: '2025-06-05T16:00:00.000Z',
            endDate: '2025-06-08T12:00:00.000Z',
            details: {
              car_rental: {
                company: 'Hertz',
                car_type: 'Citroën C3',
                pickup_location: 'Aéroport de Bruxelles',
                dropoff_location: 'Aéroport de Bruxelles',
                booking_reference: 'HZ123456'
              }
            }
          }
        ]
      }
    ];

    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route pour récupérer un voyage spécifique
app.get('/api/trips/:userId/:tripId', async (req, res) => {
  try {
    const { userId, tripId } = req.params;
    
    // Données de test
    const trip = {
      id: tripId,
      userId: userId,
      title: 'Voyage à Bruxelles',
      startDate: '2025-06-05T14:10:00.000Z',
      endDate: '2025-06-08T15:30:00.000Z',
      status: 'active',
      plans: [
        {
          id: '9rkyDgdlCZL6iuklRK8t',
          type: 'flight',
          title: 'Vol de Genève à Bruxelles',
          startDate: '2025-06-05T14:10:00.000Z',
          endDate: '2025-06-05T15:30:00.000Z',
          details: {
            flight: {
              flight_number: 'EZS1529',
              airline: 'easyJet',
              departure: {
                airport: 'GVA',
                terminal: '1',
                gate: 'A12'
              },
              arrival: {
                airport: 'BRU',
                terminal: '1',
                gate: 'B45'
              }
            }
          }
        },
        {
          id: '7tDO36lqB3556pN85ZBT',
          type: 'flight',
          title: 'Vol de Bruxelles à Genève',
          startDate: '2025-06-08T14:10:00.000Z',
          endDate: '2025-06-08T15:30:00.000Z',
          details: {
            flight: {
              flight_number: 'EZS1528',
              airline: 'easyJet',
              departure: {
                airport: 'BRU',
                terminal: '1',
                gate: 'B45'
              },
              arrival: {
                airport: 'GVA',
                terminal: '1',
                gate: 'A12'
              }
            }
          }
        },
        {
          id: 'aTeRbf6GGepAvlKlwEge',
          type: 'car_rental',
          title: 'Location de voiture à Bruxelles',
          startDate: '2025-06-05T16:00:00.000Z',
          endDate: '2025-06-08T12:00:00.000Z',
          details: {
            car_rental: {
              company: 'Hertz',
              car_type: 'Citroën C3',
              pickup_location: 'Aéroport de Bruxelles',
              dropoff_location: 'Aéroport de Bruxelles',
              booking_reference: 'HZ123456'
            }
          }
        }
      ]
    };

    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Démarrage du serveur
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 