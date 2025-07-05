const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Demo user UID
const DEMO_USER_UID = 'demo-user-123';

async function cleanDatabase() {
  console.log('🧹 Nettoyage de la base de données...');
  
  try {
    // Supprimer tous les voyages existants du demo user
    const tripsSnapshot = await db.collection('users').doc(DEMO_USER_UID).collection('trips').get();
    const deletePromises = tripsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);
    console.log(`✅ Supprimé ${tripsSnapshot.docs.length} voyages existants`);
    
    // Supprimer le document utilisateur demo s'il existe
    const userDoc = await db.collection('users').doc(DEMO_USER_UID).get();
    if (userDoc.exists) {
      await userDoc.ref.delete();
      console.log('✅ Supprimé le document utilisateur demo existant');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    throw error;
  }
}

async function createEmptyTemplates() {
  console.log('📝 Création des structures de templates vides...');
  
  try {
    // 1. Créer le document utilisateur demo
    const userData = {
      displayName: "Utilisateur Demo",
      email: "demo@bobiconic.com",
      preferences: {
        language: "fr",
        currency: "EUR",
        defaultView: "map"
      },
      loyaltyPrograms: [
        {
          program: "FlyingBlue",
          number: "FB123456",
          status: "Gold",
          expiry: "2026-03-01"
        }
      ],
      notificationSettings: {
        flightStatus: true,
        checkInReminders: true,
        securityAlerts: true
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(DEMO_USER_UID).set(userData);
    console.log('✅ Document utilisateur demo créé');
    
    // 2. Créer un voyage template vide
    const tripData = {
      title: "Voyage Template",
      startDate: admin.firestore.Timestamp.fromDate(new Date('2024-07-05T07:15:00+02:00')),
      endDate: admin.firestore.Timestamp.fromDate(new Date('2024-07-15T13:00:00+02:00')),
      origin: {
        code: "GVA",
        city: "Genève",
        country: "Suisse"
      },
      destination: {
        code: "ATH",
        city: "Athènes",
        country: "Grèce"
      },
      summary: "Voyage template pour démonstration",
      currency: "EUR",
      totalBudget: 2500,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    const tripRef = await db.collection('users').doc(DEMO_USER_UID).collection('trips').add(tripData);
    console.log('✅ Voyage template créé avec ID:', tripRef.id);
    
    // 3. Créer des items templates vides pour chaque type
    const itemTemplates = [
      {
        type: "flight",
        order: 1,
        title: "Vol Template - Aegean Airlines",
        startTime: admin.firestore.Timestamp.fromDate(new Date('2024-07-05T07:15:00+02:00')),
        endTime: admin.firestore.Timestamp.fromDate(new Date('2024-07-05T10:45:00+03:00')),
        location: {
          code: "GVA",
          name: "Genève Aéroport",
          address: ""
        },
        notes: "Template de vol - à personnaliser",
        airline: {
          name: "Aegean Airlines",
          iata: "A3",
          icao: "AEE",
          callsign: "AEGEAN"
        },
        flightNumber: "847",
        callSign: "AEGEAN847",
        confirmationNumber: "TEMPLATE123",
        aircraftType: "Airbus A320-232",
        departureAirport: {
          code: "GVA",
          name: "Genève Aéroport",
          terminal: "1",
          gate: "A3"
        },
        arrivalAirport: {
          code: "ATH",
          name: "Aéroport ATH",
          terminal: "1",
          gate: "B12"
        },
        durationMin: 210,
        distanceKm: 1940
      },
      {
        type: "hotel",
        order: 2,
        title: "Hôtel Template",
        startTime: admin.firestore.Timestamp.fromDate(new Date('2024-07-05T14:00:00+03:00')),
        endTime: admin.firestore.Timestamp.fromDate(new Date('2024-07-07T09:00:00+03:00')),
        location: {
          code: "ATH",
          name: "Athènes",
          address: ""
        },
        notes: "Template d'hôtel - à personnaliser",
        hotelName: "Electra Palace Athens",
        address: "18-20 Nikodimou St, Plaka, Athènes 105 57",
        checkIn: admin.firestore.Timestamp.fromDate(new Date('2024-07-05T14:00:00+03:00')),
        checkOut: admin.firestore.Timestamp.fromDate(new Date('2024-07-07T09:00:00+03:00')),
        phone: "+30 210 3370000",
        reservationId: "HOTEL-TEMPLATE"
      },
      {
        type: "activity",
        order: 3,
        title: "Activité Template",
        startTime: admin.firestore.Timestamp.fromDate(new Date('2024-07-06T09:00:00+03:00')),
        endTime: admin.firestore.Timestamp.fromDate(new Date('2024-07-06T13:00:00+03:00')),
        location: {
          code: "ATH",
          name: "Athènes",
          address: ""
        },
        notes: "Template d'activité - à personnaliser",
        activityName: "Visite guidée Template",
        meetingPoint: "Point de rendez-vous template",
        reservationId: "ACT-TEMPLATE"
      },
      {
        type: "expense",
        order: 4,
        title: "Dépense Template",
        startTime: admin.firestore.Timestamp.fromDate(new Date('2024-07-06T14:30:00+03:00')),
        endTime: admin.firestore.Timestamp.fromDate(new Date('2024-07-06T14:30:00+03:00')),
        location: {
          code: "ATH",
          name: "Athènes",
          address: ""
        },
        notes: "Template de dépense - à personnaliser",
        amount: 45.00,
        currency: "EUR",
        category: "Food",
        receiptUrl: "",
        date: admin.firestore.Timestamp.fromDate(new Date('2024-07-06T14:30:00+03:00'))
      }
    ];
    
    // Créer les items templates
    for (const itemTemplate of itemTemplates) {
      await tripRef.collection('items').add(itemTemplate);
    }
    
    console.log(`✅ ${itemTemplates.length} items templates créés`);
    console.log('📋 Types d\'items créés: flight, hotel, activity, expense');
    
    console.log('\n🎉 Structure de templates créée avec succès !');
    console.log('📍 Chemin Firestore: users/demo-user-123/trips/[tripId]/items/[itemId]');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des templates:', error);
    throw error;
  }
}

async function main() {
  try {
    await cleanDatabase();
    await createEmptyTemplates();
    console.log('\n✅ Opération terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main(); 