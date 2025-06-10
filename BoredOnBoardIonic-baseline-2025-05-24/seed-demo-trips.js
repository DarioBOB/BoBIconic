"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
// Chemin vers le fichier de credentials
const serviceAccount = require('./firebase-service-account.json');
// UID du user de démo (fourni)
const DEMO_UID = 'fUBBVpboDeaUjD6w2nz0xKni9mG3';
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
function getToday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}
function seedDemoData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Création/mise à jour du user de démo (ne touche pas aux autres users)
            yield db.collection('users').doc(DEMO_UID).set({
                uid: DEMO_UID,
                email: 'guestuser@demo.com',
                firstName: { fr: 'Utilisateur', en: 'Guest' },
                lastName: { fr: 'Invité', en: 'User' },
                preferredLang: 'fr',
                createdAt: new Date(),
                lastLogin: new Date(),
                isDemo: true
            }, { merge: true });
            console.log('User démo créé/mis à jour');
            // Suppression des anciens voyages de démo (userId = DEMO_UID et createdByDemo = true)
            const oldDemoTrips = yield db.collection('trips')
                .where('userId', '==', DEMO_UID)
                .where('createdByDemo', '==', true)
                .get();
            for (const doc of oldDemoTrips.docs) {
                // Suppression des plans associés (userId = DEMO_UID et tripId = doc.id et createdByDemo = true)
                const plans = yield db.collection('plans')
                    .where('tripId', '==', doc.id)
                    .where('userId', '==', DEMO_UID)
                    .where('createdByDemo', '==', true)
                    .get();
                for (const plan of plans.docs) {
                    yield plan.ref.delete();
                }
                // Suppression du voyage
                yield doc.ref.delete();
            }
            // Création des voyages/plans de démo
            const today = getToday();
            const ongoingStart = addDays(today, -1);
            const ongoingEnd = addDays(today, 2);
            const futureStart = addDays(today, 10);
            const futureEnd = addDays(today, 15);
            const pastStart = addDays(today, -10);
            const pastEnd = addDays(today, -5);
            const demoTrips = [
                {
                    // Voyage passé
                    title: { fr: 'Voyage passé à Barcelone', en: 'Past trip in Barcelona' },
                    startDate: pastStart,
                    endDate: pastEnd,
                    userId: DEMO_UID,
                    createdByDemo: true,
                    plans: [
                        {
                            type: 'flight',
                            title: { fr: 'Vol Paris → Barcelone', en: 'Flight Paris → Barcelona' },
                            startDate: pastStart,
                            endDate: addDays(pastStart, 1),
                            details: {
                                flight: {
                                    flight_number: 'VY8001',
                                    airline: 'VY',
                                    departure: { airport: 'CDG', city: 'Paris' },
                                    arrival: { airport: 'BCN', city: 'Barcelone' },
                                    aircraft: 'A320'
                                }
                            }
                        },
                        {
                            type: 'hotel',
                            title: { fr: 'Hôtel Barcelona Center', en: 'Barcelona Center Hotel' },
                            startDate: addDays(pastStart, 1),
                            endDate: pastEnd,
                            details: {
                                address: 'Carrer de Balmes, 103, Barcelona',
                                phone: '+34 93 1234567'
                            }
                        },
                        {
                            type: 'car_rental',
                            title: { fr: 'Location voiture', en: 'Car rental' },
                            startDate: addDays(pastStart, 1),
                            endDate: pastEnd,
                            details: {
                                company: 'Sixt',
                                pickup: 'Aéroport BCN',
                                dropoff: 'Aéroport BCN'
                            }
                        }
                    ]
                },
                {
                    // Voyage en cours
                    title: { fr: 'Voyage en cours à Rome', en: 'Ongoing trip in Rome' },
                    startDate: ongoingStart,
                    endDate: ongoingEnd,
                    userId: DEMO_UID,
                    createdByDemo: true,
                    plans: [
                        {
                            type: 'flight',
                            title: { fr: 'Vol Paris → Rome', en: 'Flight Paris → Rome' },
                            startDate: ongoingStart,
                            endDate: addDays(ongoingStart, 1),
                            details: {
                                flight: {
                                    flight_number: 'AF1234',
                                    airline: 'AF',
                                    departure: { airport: 'CDG', city: 'Paris' },
                                    arrival: { airport: 'FCO', city: 'Rome' },
                                    aircraft: 'A320'
                                }
                            }
                        },
                        {
                            type: 'hotel',
                            title: { fr: 'Hôtel Roma Center', en: 'Roma Center Hotel' },
                            startDate: ongoingStart,
                            endDate: ongoingEnd,
                            details: {
                                address: 'Via Roma 1, Rome',
                                phone: '+39 06 1234567'
                            }
                        },
                        {
                            type: 'activity',
                            title: { fr: 'Visite du Colisée', en: 'Colosseum Visit' },
                            startDate: addDays(ongoingStart, 2),
                            endDate: addDays(ongoingStart, 2),
                            details: {
                                location: 'Colisée, Rome'
                            }
                        }
                    ]
                },
                {
                    // Voyage futur
                    title: { fr: 'Vacances à Montréal', en: 'Holiday in Montreal' },
                    startDate: futureStart,
                    endDate: futureEnd,
                    userId: DEMO_UID,
                    createdByDemo: true,
                    plans: [
                        {
                            type: 'flight',
                            title: { fr: 'Vol Paris → Montréal', en: 'Flight Paris → Montreal' },
                            startDate: futureStart,
                            endDate: addDays(futureStart, 1),
                            details: {
                                flight: {
                                    flight_number: 'AC875',
                                    airline: 'AC',
                                    departure: { airport: 'CDG', city: 'Paris' },
                                    arrival: { airport: 'YUL', city: 'Montréal' },
                                    aircraft: 'B777'
                                }
                            }
                        },
                        {
                            type: 'hotel',
                            title: { fr: 'Hôtel Montréal Center', en: 'Montreal Center Hotel' },
                            startDate: addDays(futureStart, 1),
                            endDate: futureEnd,
                            details: {
                                address: 'Rue Sainte-Catherine, Montréal',
                                phone: '+1 514 1234567'
                            }
                        },
                        {
                            type: 'transfer',
                            title: { fr: 'Transfert aéroport', en: 'Airport transfer' },
                            startDate: futureEnd,
                            endDate: futureEnd,
                            details: {
                                company: 'Taxi Coop',
                                pickup: 'Aéroport YUL',
                                dropoff: 'Centre-ville Montréal'
                            }
                        }
                    ]
                }
            ];
            // Création des nouveaux voyages de démo
            for (const trip of demoTrips) {
                const tripRef = yield db.collection('trips').add({
                    title: trip.title,
                    startDate: trip.startDate,
                    endDate: trip.endDate,
                    userId: trip.userId,
                    createdByDemo: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                for (const plan of trip.plans) {
                    yield db.collection('plans').add(Object.assign(Object.assign({}, plan), { tripId: tripRef.id, userId: trip.userId, createdByDemo: true, createdAt: new Date(), updatedAt: new Date() }));
                }
                console.log('Voyage démo créé:', trip.title.fr, '/', trip.title.en);
            }
            console.log('✅ Données de démo insérées avec succès !');
        }
        catch (error) {
            console.error('❌ Erreur lors de la création des données:', error);
            throw error;
        }
    });
}
seedDemoData().then(() => process.exit(0)).catch(error => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
});
