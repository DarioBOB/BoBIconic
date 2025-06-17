const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function updateAllTripsDates() {
  const tripsSnap = await db.collection('trips').get();
  for (const tripDoc of tripsSnap.docs) {
    const trip = tripDoc.data();
    const tripId = tripDoc.id;
    // Récupérer tous les plans de ce trip
    const plansSnap = await db.collection('plans').where('tripId', '==', tripId).get();
    if (plansSnap.empty) {
      console.log(`[TRIP] ${tripId} : aucun plan, pas de mise à jour.`);
      continue;
    }
    // Trouver la date la plus tôt et la plus tardive
    let minStart = null;
    let maxEnd = null;
    plansSnap.forEach(planDoc => {
      const plan = planDoc.data();
      const start = plan.startDate && plan.startDate.toDate ? plan.startDate.toDate() : new Date(plan.startDate);
      const end = plan.endDate && plan.endDate.toDate ? plan.endDate.toDate() : new Date(plan.endDate);
      if (!minStart || start < minStart) minStart = start;
      if (!maxEnd || end > maxEnd) maxEnd = end;
    });
    // Mettre à jour le trip si besoin
    const tripStart = trip.startDate && trip.startDate.toDate ? trip.startDate.toDate() : new Date(trip.startDate);
    const tripEnd = trip.endDate && trip.endDate.toDate ? trip.endDate.toDate() : new Date(trip.endDate);
    if (minStart.getTime() !== tripStart.getTime() || maxEnd.getTime() !== tripEnd.getTime()) {
      await db.collection('trips').doc(tripId).update({
        startDate: admin.firestore.Timestamp.fromDate(minStart),
        endDate: admin.firestore.Timestamp.fromDate(maxEnd),
        updatedAt: new Date()
      });
      console.log(`[TRIP] ${tripId} mis à jour : ${minStart.toISOString()} -> ${maxEnd.toISOString()}`);
    } else {
      console.log(`[TRIP] ${tripId} déjà à jour.`);
    }
  }
  console.log('Mise à jour des dates de tous les voyages terminée.');
}

updateAllTripsDates().then(() => process.exit(0)); 