require('dotenv').config();

if (!process.env.FIREBASE_KEY && process.env.FIREBASE_KEY_1 && process.env.FIREBASE_KEY_2 && process.env.FIREBASE_KEY_3) {
    // Concatène les 3 parties et encode en base64
    const key = process.env.FIREBASE_KEY_1 + process.env.FIREBASE_KEY_2 + process.env.FIREBASE_KEY_3;
    process.env.FIREBASE_KEY = Buffer.from(key).toString('base64');
}

const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const OpenAI = require('openai');
const { enrichFlightSegmentWithFR24 } = require('./fr24');

// Configuration Firebase
const firebaseConfig = {
    credential: cert(JSON.parse(Buffer.from(process.env.FIREBASE_KEY, 'base64').toString()))
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuration IMAP
const imapConfig = {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: process.env.EMAIL_HOST,
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
};

// Modèles de recherche pour les emails
const EMAIL_PATTERNS = {
    easyjet: {
        from: ['easyjet.com', 'no-reply@easyjet.com'],
        subject: /confirmation|réservation|booking|flight/i
    },
    tripit: {
        from: ['tripit.com', 'noreply@tripit.com'],
        subject: /voyage|itinéraire|réservation|flight/i
    },
    airfrance: {
        from: ['airfrance.com', 'noreply@airfrance.com'],
        subject: /confirmation|réservation|booking|flight/i
    },
    lufthansa: {
        from: ['lufthansa.com', 'noreply@lufthansa.com'],
        subject: /confirmation|réservation|booking|flight/i
    }
};

// === TABLES DE MAPPING ===
const AIRPORTS = {
    'Genève': { iata: 'GVA', name: 'Genève Aéroport', city: 'Genève', country: 'Suisse', timezone: 'Europe/Zurich' },
    'Bruxelles Intl': { iata: 'BRU', name: 'Brussels Airport', city: 'Bruxelles', country: 'Belgique', timezone: 'Europe/Brussels' },
    'Bruxelles': { iata: 'BRU', name: 'Brussels Airport', city: 'Bruxelles', country: 'Belgique', timezone: 'Europe/Brussels' },
    // Ajoute d'autres aéroports ici si besoin
};
const AIRLINES = {
    'EZS': { name: 'easyJet', iata: 'U2', icao: 'EZY' },
    'U2': { name: 'easyJet', iata: 'U2', icao: 'EZY' },
    // Ajoute d'autres compagnies ici si besoin
};

// Fonction utilitaire pour valider une réservation
function validateReservation(reservation) {
    const requiredFields = ['id', 'type', 'provider', 'departureDate', 'arrivalDate', 'departureLocation', 'arrivalLocation'];
    const missingFields = requiredFields.filter(field => !reservation[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Champs obligatoires manquants : ${missingFields.join(', ')}`);
    }
    
    if (reservation.departureDate > reservation.arrivalDate) {
        throw new Error('Dates invalides : la date de départ est postérieure à la date d\'arrivée');
    }
    
    return true;
}

function cleanEasyJetText(text) {
    // Supprimer les bordures de tableau et pipes inutiles
    return text.replace(/\|/g, ' ').replace(/ +/g, ' ').replace(/\n +/g, '\n');
}

function parseGenericEmail(email) {
    const reservations = [];
    const body = email.text;
    try {
        // Nettoyer le texte
        const lines = body.split('\n').map(line => line.trim()).filter(line => line);
        let currentBlock = [];
        let found = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(' à ') && line.match(/[A-Za-zÀ-ÿ\s]+ à [A-Za-zÀ-ÿ\s]+/)) {
                currentBlock = [line];
                found = true;
            } else if (found && line.match(/EZS\d{4}/)) {
                currentBlock.push(line);
            } else if (found && line.includes('Départ')) {
                currentBlock.push(line);
            } else if (found && line.includes('Arrivée')) {
                currentBlock.push(line);
                // On a un bloc complet, on l'analyse
                console.log('Bloc segment détecté:', currentBlock);
                const departureCity = currentBlock[0].split(' à ')[0].trim();
                const arrivalCity = currentBlock[0].split(' à ')[1].trim();
                const flightCode = currentBlock[1].match(/EZS\d{4}/)[0];
                const departureDateStr = currentBlock[2].replace(/Départ[ :]*/, '').trim();
                const arrivalDateStr = currentBlock[3].replace(/Arrivée[ :]*/, '').trim();
                const departureDate = parseEasyJetDate(departureDateStr);
                const arrivalDate = parseEasyJetDate(arrivalDateStr);
                const reservation = {
                    id: `${flightCode}-${Date.now()}`,
                    type: 'FLIGHT',
                    provider: 'Unknown',
                    confirmationNumber: '',
                    departureDate,
                    arrivalDate,
                    departureLocation: departureCity,
                    arrivalLocation: arrivalCity,
                    status: 'CONFIRMED',
                    details: {
                        flight_code: flightCode,
                        email_date: email.date?.getTime?.() || Date.now(),
                        method: 'generic'
                    }
                };
                if (validateReservation(reservation)) {
                    reservations.push(reservation);
                }
                found = false;
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'analyse générique de l\'email:', error);
    }
    return reservations;
}

function parseEasyJetDate(str) {
    // Ex: jeu. 05 juin 2025 14:10
    const pattern = /([0-9]{2}) ([a-zéû]+) ([0-9]{4}) ([0-9]{2}):([0-9]{2})/i;
    const mois = {
        'janvier':0,'février':1,'mars':2,'avril':3,'mai':4,'juin':5,'juillet':6,'août':7,'septembre':8,'octobre':9,'novembre':10,'décembre':11
    };
    const m = str.match(pattern);
    if (m) {
        const d = parseInt(m[1]);
        const month = mois[m[2].toLowerCase()] ?? 0;
        const y = parseInt(m[3]);
        const h = parseInt(m[4]);
        const min = parseInt(m[5]);
        return new Date(y, month, d, h, min).getTime();
    }
    return null;
}

// Fonction pour analyser un email TripIt
function parseTripItEmail(email) {
    const reservations = [];
    const body = email.text;
    
    try {
        // Modèle pour les segments de vol avec plus de détails
        const segmentPattern = /(?:Flight|Vol)\s*:\s*(?:([A-Z0-9]{2,3})\s*(\d{3,4})|([A-Z]{3})\s*-\s*([A-Z]{3})).*?(?:Date|Date de départ)\s*:\s*([^\n]+).*?(?:Time|Heure)\s*:\s*([^\n]+).*?(?:Status|Statut)\s*:\s*([^\n]+).*?(?:Duration|Durée)\s*:\s*([^\n]+)?/gis;
        
        let match;
        while ((match = segmentPattern.exec(body)) !== null) {
            const airline = match[1];
            const flightNumber = match[2];
            const departureCode = match[3];
            const arrivalCode = match[4];
            const dateStr = match[5];
            const timeStr = match[6];
            const statusStr = match[7];
            const durationStr = match[8];
            
            const departureDateTime = new Date(`${dateStr} ${timeStr}`).getTime();
            const arrivalDateTime = durationStr ? 
                calculateArrivalTime(departureDateTime, durationStr) : 
                calculateArrivalTime(departureDateTime);
            
            const reservation = {
                id: `${airline}${flightNumber}-${extractConfirmationNumber(body)}`,
                type: 'FLIGHT',
                provider: airline,
                confirmationNumber: extractConfirmationNumber(body),
                departureDate: departureDateTime,
                arrivalDate: arrivalDateTime,
                departureLocation: departureCode,
                arrivalLocation: arrivalCode,
                status: parseStatus(statusStr),
                details: {
                    airline: airline,
                    flight_number: flightNumber,
                    departure_code: departureCode,
                    arrival_code: arrivalCode,
                    duration: durationStr,
                    email_date: email.date.getTime()
                }
            };
            
            // Valider la réservation avant de l'ajouter
            if (validateReservation(reservation)) {
                reservations.push(reservation);
            }
        }
    } catch (error) {
        console.error('Erreur lors de l\'analyse de l\'email TripIt:', error);
    }
    
    return reservations;
}

function extractConfirmationNumber(body) {
    const patterns = [
        /(?:Confirmation|Booking)\s+(?:Number|Reference)\s*:\s*([A-Z0-9]{6,})/i,
        /(?:Confirmation|Booking)\s+(?:Number|Reference)\s*:\s*([A-Z0-9]{6,})/i,
        /(?:Confirmation|Booking)\s+(?:Number|Reference)\s*:\s*([A-Z0-9]{6,})/i
    ];
    
    for (const pattern of patterns) {
        const match = body.match(pattern);
        if (match) return match[1];
    }
    
    return '';
}

function calculateArrivalTime(departureTime, durationStr = '2h') {
    if (durationStr) {
        const hours = parseInt(durationStr.match(/(\d+)h/)?.[1] || '2');
        const minutes = parseInt(durationStr.match(/(\d+)m/)?.[1] || '0');
        return departureTime + (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    }
    return departureTime + (2 * 60 * 60 * 1000);
}

function parseStatus(statusStr) {
    const status = statusStr.toLowerCase();
    if (status.includes('confirm')) return 'CONFIRMED';
    if (status.includes('cancel')) return 'CANCELLED';
    if (status.includes('complete')) return 'COMPLETED';
    if (status.includes('pending')) return 'PENDING';
    if (status.includes('delay')) return 'DELAYED';
    if (status.includes('board')) return 'BOARDING';
    return 'UNKNOWN';
}

// Fonction pour sauvegarder une réservation avec nouvelle tentative
async function saveReservationWithRetry(reservation, maxRetries = 3) {
    let retries = 0;
    while (retries < maxRetries) {
        try {
            await db.collection('reservations').doc(reservation.id).set(reservation);
            console.log(`Réservation ${reservation.id} sauvegardée avec succès`);
            return true;
        } catch (error) {
            retries++;
            if (retries === maxRetries) {
                console.error(`Échec de la sauvegarde de la réservation ${reservation.id} après ${maxRetries} tentatives:`, error);
                return false;
            }
            console.warn(`Nouvelle tentative ${retries}/${maxRetries} pour la réservation ${reservation.id}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        }
    }
    return false;
}

// Parser classique (exemple simplifié)
function parseClassicEmail(email) {
    // Ici, on pourrait mettre une logique regex simple pour détecter un vol
    const body = email.text;
    const classicPattern = /([A-Z]{3})\s*-\s*([A-Z]{3}).*?(\d{1,2} [A-Za-z]{3} \d{4})/s;
    const match = body.match(classicPattern);
    if (match) {
        return [{
            id: `classic-${Date.now()}`,
            type: 'FLIGHT',
            provider: 'Unknown',
            confirmationNumber: '',
            departureDate: new Date(match[3]).getTime(),
            arrivalDate: new Date(match[3]).getTime() + 2 * 60 * 60 * 1000,
            departureLocation: match[1],
            arrivalLocation: match[2],
            status: 'CONFIRMED',
            details: { method: 'classic' }
        }];
    }
    return [];
}

// Parser IA (OpenAI)
async function parseWithAI(email) {
    try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `Voici un email de réservation de vol. Extrait-moi les infos principales (compagnie, numéro de vol, aéroports, dates, etc.) au format JSON :\n\n${email.text}`;
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 400
        });
        const text = completion.choices[0].message.content;
        const json = JSON.parse(text);
        if (json && Array.isArray(json.reservations) && json.reservations.length > 0) {
            return json.reservations;
        }
    } catch (e) {
        console.error('Erreur parsing IA:', e.message);
    }
    return [];
}

function enrichReservation(res) {
    // Mapper aéroports
    const dep = AIRPORTS[res.departureLocation.replace(/\|/g, '').trim()] || { iata: '', name: res.departureLocation.replace(/\|/g, '').trim(), city: '', country: '', timezone: '' };
    const arr = AIRPORTS[res.arrivalLocation.replace(/\|/g, '').trim()] || { iata: '', name: res.arrivalLocation.replace(/\|/g, '').trim(), city: '', country: '', timezone: '' };
    // Mapper compagnie
    let airlineCode = '';
    let flightNumber = '';
    if (res.details && res.details.flight_code) {
        const match = res.details.flight_code.match(/([A-Z]{2,3})(\d{3,4})/);
        if (match) {
            airlineCode = match[1];
            flightNumber = match[2];
        }
    }
    const airline = AIRLINES[airlineCode] || { name: 'Unknown', iata: airlineCode, icao: '' };
    // Confirmation
    let confirmation = res.confirmationNumber;
    if (!confirmation && res.details && res.details.email_text) {
        const confMatch = res.details.email_text.match(/(K\d{6,7}|[A-Z0-9]{6,8})/);
        if (confMatch) confirmation = confMatch[1];
    }
    // Durée
    let duration = '';
    if (res.departureDate && res.arrivalDate) {
        const diff = Math.abs(res.arrivalDate - res.departureDate);
        const h = Math.floor(diff / 3600000);
        const m = Math.round((diff % 3600000) / 60000);
        duration = `${h}h${m>0?m:''}`;
    }
    // Siège
    let seat = '';
    if (res.details && res.details.email_text) {
        const seatMatch = res.details.email_text.match(/Si[eè]ge:?\s*\|?\s*([A-Z0-9]+)/i);
        if (seatMatch) seat = seatMatch[1];
    }
    // Terminal
    let terminal = '';
    if (res.details && res.details.email_text) {
        const terminalMatch = res.details.email_text.match(/Terminal:?\s*([A-Z0-9]+)/i);
        if (terminalMatch) terminal = terminalMatch[1];
    }
    // Porte
    let gate = '';
    if (res.details && res.details.email_text) {
        // Cherche explicitement 'Porte' suivi d'un code plausible (A12, B3, 25, etc.)
        const gateMatch = res.details.email_text.match(/Porte:?\s*([A-Z]{1,2}\d{1,3}|\d{1,3})\b(?![a-zA-Z])/i);
        if (gateMatch) {
            // Filtre les faux positifs comme 'Rendre'
            if (!/Rendre/i.test(gateMatch[0])) {
                gate = gateMatch[1];
            }
        }
    }
    // Bagages cabine
    let baggageCabin = '';
    if (res.details && res.details.email_text) {
        const bagCabinMatch = res.details.email_text.match(/Petit bagage à main:?\s*\|?\s*([\w\s,\.x\-\(\)]+)/i);
        if (bagCabinMatch) baggageCabin = bagCabinMatch[1].trim();
    }
    // Bagages soute
    let baggageHold = '';
    if (res.details && res.details.email_text) {
        const bagHoldMatch = res.details.email_text.match(/Bagage en soute:?\s*\|?\s*([\w\s,\.x\-\(\)]+)/i);
        if (bagHoldMatch) baggageHold = bagHoldMatch[1].trim();
    }
    // Statut
    let status = res.status;
    if (res.details && res.details.email_text) {
        if (/annul[ée]/i.test(res.details.email_text)) status = 'CANCELLED';
        else if (/planifi[ée]/i.test(res.details.email_text)) status = 'PLANNED';
        else if (/confirm[ée]/i.test(res.details.email_text)) status = 'CONFIRMED';
    }
    // Passager principal
    let mainPassenger = '';
    if (res.details && res.details.email_text) {
        const passengerMatch = res.details.email_text.match(/M\s+([A-Z\s]+)/i);
        if (passengerMatch) mainPassenger = passengerMatch[1].trim();
    }
    // Construction enrichie
    return {
        ...res,
        confirmationNumber: confirmation,
        departureAirport: dep,
        arrivalAirport: arr,
        airline: airline,
        flightNumber: res.details && res.details.flight_code ? `${airline.iata} ${flightNumber}` : '',
        seat: seat,
        terminal: terminal,
        gate: gate,
        baggage: {
            cabin: baggageCabin,
            hold: baggageHold
        },
        duration: duration,
        status: status,
        mainPassenger: mainPassenger,
        departureDateISO: res.departureDate ? new Date(res.departureDate).toISOString() : '',
        arrivalDateISO: res.arrivalDate ? new Date(res.arrivalDate).toISOString() : '',
    };
}

// Détection du type de plan
function detectPlanType(emailText) {
    const text = emailText.toLowerCase();
    
    // Détection des vols
    if (/vol|flight|départ|arrivée|aéroport|terminal|boarding|gate|flight number|numéro de vol|compagnie/i.test(text)) {
        return 'FLIGHT';
    }
    
    // Détection des hôtels
    if (/hôtel|hotel|check-in|check-out|chambre|room|night|nuit|booking|réservation/i.test(text)) {
        return 'HOTEL';
    }
    
    // Détection des locations de voiture
    if (/location de voiture|car rental|pick-up|drop-off|vehicle|voiture|récupérer|rendre/i.test(text)) {
        return 'CAR';
    }
    
    // Détection des activités
    if (/activité|activity|tour|excursion|visite|visit|ticket|billet/i.test(text)) {
        return 'ACTIVITY';
    }
    
    return 'UNKNOWN';
}

// Extraction des informations de vol
function extractFlightInfo(emailText) {
    const info = {
        type: 'FLIGHT',
        provider: 'Unknown',
        confirmationNumber: '',
        departureDate: null,
        arrivalDate: null,
        departureLocation: '',
        arrivalLocation: '',
        status: 'UNKNOWN',
        details: {
            flight_code: '',
            email_date: Date.now(),
            method: 'generic',
            email_text: emailText
        },
        baggage: {
            cabin: '',
            hold: ''
        },
        passenger: {
            name: '',
            seat: ''
        }
    };

    // Numéro de confirmation
    const confMatch = emailText.match(/réservation:?\s*([A-Z0-9]+)/i);
    if (confMatch) {
        info.confirmationNumber = confMatch[1];
    }

    // Compagnie aérienne
    if (emailText.includes('easyJet')) {
        info.provider = 'easyJet';
    }

    // Vol aller
    const outboundMatch = emailText.match(/Genève à ([^|]+)/);
    if (outboundMatch) {
        info.departureLocation = 'Genève';
        info.arrivalLocation = outboundMatch[1].trim();
    }

    // Dates et heures
    const dateMatch = emailText.match(/Départ\s*:\s*([^|]+)\s*\|\s*Arrivée\s*:\s*([^|]+)/);
    if (dateMatch) {
        const depDate = new Date(dateMatch[1].trim());
        const arrDate = new Date(dateMatch[2].trim());
        if (!isNaN(depDate.getTime())) info.departureDate = depDate;
        if (!isNaN(arrDate.getTime())) info.arrivalDate = arrDate;
    }

    // Code de vol
    const flightMatch = emailText.match(/([A-Z]{2,3}\d{3,4})\s*\|/);
    if (flightMatch) {
        info.details.flight_code = flightMatch[1];
    }

    // Statut
    if (emailText.includes('annulé') || emailText.includes('canceled')) {
        info.status = 'CANCELLED';
    } else if (emailText.includes('confirmé') || emailText.includes('confirmed')) {
        info.status = 'CONFIRMED';
    } else {
        info.status = 'PLANNED';
    }

    // Passager et siège
    const passengerMatch = emailText.match(/M\s+([A-Z\s]+)\s*\|\s*Siège:\s*([A-Z0-9]+)/);
    if (passengerMatch) {
        info.passenger.name = passengerMatch[1].trim();
        info.passenger.seat = passengerMatch[2].trim();
    }

    // Bagages
    const cabinMatch = emailText.match(/bagage à main sous le siège\s*\(max\.\s*([^)]+)\)/);
    if (cabinMatch) {
        info.baggage.cabin = `1x ${cabinMatch[1].trim()}`;
    }

    const holdMatch = emailText.match(/Bagage en soute\s*:\s*([^|]+)/);
    if (holdMatch) {
        info.baggage.hold = holdMatch[1].trim();
    }

    return info;
}

// Extraction des informations de location de voiture
function extractCarInfo(emailText) {
    const carInfo = {
        type: 'CAR',
        provider: 'Unknown',
        confirmationNumber: '',
        pickupDate: null,
        dropoffDate: null,
        pickupLocation: '',
        dropoffLocation: '',
        vehicle: '',
        status: 'PLANNED',
        details: {
            email_date: Date.now(),
            method: 'generic',
            email_text: emailText
        }
    };

    // Extraction du numéro de réservation
    const confMatch = emailText.match(/Numéro de réservation\s*([A-Z0-9]+)/i);
    if (confMatch) {
        carInfo.confirmationNumber = confMatch[1];
    }

    // Extraction du véhicule
    const vehicleMatch = emailText.match(/([A-Za-z\s]+)\s*ou équivalent/i);
    if (vehicleMatch) {
        carInfo.vehicle = vehicleMatch[1].trim();
    }

    // Extraction des dates et lieux
    const pickupMatch = emailText.match(/Récupérer\s*([^|]+)\s*([^|]+)/i);
    const dropoffMatch = emailText.match(/Rendre\s*([^|]+)\s*([^|]+)/i);

    if (pickupMatch) {
        carInfo.pickupLocation = pickupMatch[1].trim();
        carInfo.pickupDate = new Date(pickupMatch[2].trim()).getTime();
    }

    if (dropoffMatch) {
        carInfo.dropoffLocation = dropoffMatch[1].trim();
        carInfo.dropoffDate = new Date(dropoffMatch[2].trim()).getTime();
    }

    return carInfo;
}

// Fonction principale de traitement des emails
async function processEmail(email) {
    const emailText = email.text;
    const sender = email.from?.value?.[0]?.address || '';
    const plans = [];

    // === Extraction des segments de vol ===
    const flightBlocks = [];
    const lines = emailText.split('\n').map(l => l.trim());
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].match(/[A-Za-zÀ-ÿ\s]+ à [A-Za-zÀ-ÿ\s]+/)) {
            const block = [lines[i]];
            let j = i + 1;
            while (j < lines.length && (lines[j].match(/EZS\d{4}/) || lines[j].match(/Départ/) || lines[j].match(/Arrivée/) || lines[j].match(/Siège/) || lines[j].match(/bagage/i) || lines[j].match(/Terminal/i) || lines[j].match(/Porte/i) || lines[j].length < 40)) {
                block.push(lines[j]);
                j++;
            }
            flightBlocks.push(block);
            i = j - 1;
        }
    }
    for (const block of flightBlocks) {
        let departureLocation = '', arrivalLocation = '', flightCode = '', departureDate = null, arrivalDate = null, seat = '', passenger = '', baggageCabin = '', baggageHold = '', confirmationNumber = '', terminal = '', gate = '', status = 'PLANNED', provider = 'Unknown';
        // Villes
        const villeMatch = block[0].split(' à ');
        if (villeMatch.length === 2) {
            departureLocation = villeMatch[0].replace(/\|/g, '').trim();
            arrivalLocation = villeMatch[1].replace(/\|/g, '').trim();
        }
        // Code vol et provider
        for (const l of block) {
            const m = l.match(/([A-Z]{2,3})\d{4}/);
            if (m) {
                flightCode = l.match(/([A-Z]{2,3}\d{4})/)[0];
                provider = AIRLINES[m[1]] ? AIRLINES[m[1]].name : 'Unknown';
            }
        }
        // Dates
        for (const l of block) {
            if (l.match(/Départ/)) departureDate = parseEasyJetDate(l.replace(/Départ[ :]*/, ''));
            if (l.match(/Arrivée/)) arrivalDate = parseEasyJetDate(l.replace(/Arrivée[ :]*/, ''));
        }
        // DEBUG : afficher toutes les lignes du bloc de vol après nettoyage
        console.log('🔎 Bloc de vol (nettoyé) :');
        for (const l of block) {
            const cleanLine = l.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
            console.log('  >', cleanLine);
        }
        // Extraction du nom du passager
        let foundPassenger = '';
        for (const l of block) {
            const cleanLine = l.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim();
            // Regex : 'M' n'importe où dans la ligne, suivi d'un nom complet
            const m = cleanLine.match(/\bM\s+([A-ZÀ-ÿ\-\s']+)/i);
            if (m && m[1]) {
                foundPassenger = m[1].trim();
                console.log('🧑‍✈️ [REGEX] Nom passager détecté:', foundPassenger);
                break;
            }
        }
        // Si non trouvé, tenter avec l'IA sur le bloc de vol
        if (!foundPassenger) {
            const blockText = block.join('\n');
            try {
                const openai = new (require('openai'))({ apiKey: process.env.OPENAI_API_KEY });
                const prompt = `Voici un extrait d'email de réservation de vol. Extrait uniquement le nom du passager principal (ex: DARIO MANGANO) :\n${blockText}`;
                const completion = await openai.chat.completions.create({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 20
                });
                const aiName = completion.choices[0].message.content.trim();
                if (aiName && aiName.length > 2 && /[A-ZÀ-ÿ]/i.test(aiName)) {
                    foundPassenger = aiName;
                    console.log('🧑‍✈️ [AI] Nom passager détecté:', foundPassenger);
                }
            } catch (e) {
                console.warn('⚠️ [AI] Extraction nom passager échouée:', e.message);
            }
        }
        passenger = foundPassenger;
        // Bagages cabine (sur plusieurs lignes)
        let bagCabinLines = [];
        for (let k = 0; k < block.length; k++) {
            if (/Petit bagage à main/i.test(block[k])) {
                bagCabinLines.push(block[k]);
                if (block[k+1] && block[k+1].match(/max\./i)) bagCabinLines.push(block[k+1]);
            }
        }
        if (bagCabinLines.length) {
            baggageCabin = bagCabinLines.map(l => l.replace(/Petit bagage à main:?\s*\|?/i, '').replace(/\(max\./i, '(').trim()).join(' ');
        }
        // Bagages soute (sur plusieurs lignes)
        let bagHoldLines = [];
        for (let k = 0; k < block.length; k++) {
            if (/Bagage en soute/i.test(block[k])) {
                bagHoldLines.push(block[k]);
                if (block[k+1] && !/bagage/i.test(block[k+1])) bagHoldLines.push(block[k+1]);
            }
        }
        if (bagHoldLines.length) {
            baggageHold = bagHoldLines.map(l => l.replace(/Bagage en soute:?\s*\|?/i, '').trim()).join(' ');
        }
        // Numéro de confirmation
        const confMatch = emailText.match(/réservation:?\s*([A-Z0-9]{6,})/i);
        if (confMatch) confirmationNumber = confMatch[1];
        // Terminal
        for (const l of block) {
            const m = l.match(/Terminal:?\s*([A-Z0-9]+)/i);
            if (m) terminal = m[1];
        }
        // Porte
        for (const l of block) {
            const m = l.match(/Porte:?\s*([A-Z]{1,2}\d{1,3}|\d{1,3})\b(?![a-zA-Z])/i);
            if (m && !/Rendre/i.test(l)) gate = m[1];
        }
        // Statut
        for (const l of block) {
            if (/annul[ée]/i.test(l)) status = 'CANCELLED';
            else if (/confirm[ée]/i.test(l)) status = 'CONFIRMED';
        }
        // Construction
        if (departureLocation && arrivalLocation && flightCode) {
            let plan = {
                type: 'FLIGHT',
                provider,
                confirmationNumber,
                departureDate,
                arrivalDate,
                departureLocation,
                arrivalLocation,
                status,
                terminal,
                gate,
                sender,
                details: {
                    flight_code: flightCode,
                    email_date: email.date?.getTime?.() || Date.now(),
                    method: 'generic',
                    email_text: emailText
                },
                baggage: {
                    cabin: baggageCabin,
                    hold: baggageHold
                },
                passenger: {
                    name: passenger,
                    seat: seat
                }
            };
            plan = await enrichFlightSegmentWithFR24(plan);
            plans.push(plan);
            console.log('✈️ Vol extrait:', JSON.stringify(plan, null, 2));
        }
    }
    // === Extraction location de voiture ===
    const carMatch = emailText.match(/Numéro de réservation\s*([A-Z0-9]+)[^\n]*\n([A-Za-z\s]+)\n[^\n]*Récupérer\s*([^\n]+)\n([^\n]+)\nRendre\s*([^\n]+)\n([^\n]+)/i);
    if (carMatch) {
        const carPlan = {
            type: 'CAR',
            provider: 'Unknown',
            confirmationNumber: carMatch[1],
            vehicle: carMatch[2].trim(),
            pickupLocation: carMatch[3].trim(),
            pickupDate: new Date(carMatch[4].trim()).getTime(),
            dropoffLocation: carMatch[5].trim(),
            dropoffDate: new Date(carMatch[6].trim()).getTime(),
            status: /confirm/i.test(emailText) ? 'CONFIRMED' : 'PLANNED',
            sender,
            details: {
                email_date: email.date?.getTime?.() || Date.now(),
                method: 'generic',
                email_text: emailText
            }
        };
        plans.push(carPlan);
        console.log('🚗 Location de voiture extraite:', JSON.stringify(carPlan, null, 2));
    }
    return plans;
}

// Fonction principale pour vérifier les emails
async function checkEmails() {
    console.log('🚀 Début du script checkEmails');
    const imap = new Imap(imapConfig);
    const allReservations = [];

    return new Promise((resolve, reject) => {
        imap.once('ready', () => {
            console.log('📬 Connexion IMAP établie');
            imap.openBox('INBOX', false, (err, box) => {
                if (err) {
                    console.error('❌ Erreur lors de l\'ouverture de la boîte mail:', err);
                    reject(err);
                    return;
                }
                console.log('📭 Boîte mail ouverte');
                
                imap.search(['UNSEEN'], (err, results) => {
                    if (err) {
                        console.error('❌ Erreur lors de la recherche d\'emails:', err);
                        reject(err);
                        return;
                    }
                    console.log(`${results.length} emails non lus trouvés`);
                    
                    if (!results.length) {
                        console.log('📭 Aucun email non lu.');
                        imap.end();
                        resolve(allReservations);
                        return;
                    }
                    
                    const fetch = imap.fetch(results, { bodies: '' });
                    let processedCount = 0;
                    fetch.on('message', (msg) => {
                        msg.on('body', (stream) => {
                            simpleParser(stream, async (err, parsed) => {
                                if (err) {
                                    console.error('❌ Erreur lors de l\'analyse de l\'email:', err);
                                    processedCount++;
                                    if (processedCount === results.length) {
                                        imap.end();
                                        resolve(allReservations);
                                    }
                                    return;
                                }
                                
                                console.log('📧 Email reçu:');
                                console.log('De:', parsed.from?.text);
                                console.log('Sujet:', parsed.subject);
                                console.log('Date:', parsed.date);
                                
                                const rawText = parsed.text || '';
                                const toEmail = parsed.to?.value?.[0]?.address;
                                const fromEmail = parsed.from?.value?.[0]?.address;
                                
                                if (toEmail !== process.env.EMAIL_USER) {
                                    console.log(`⏩ Email ignoré, destinataire non valide : ${toEmail}`);
                                    processedCount++;
                                    if (processedCount === results.length) {
                                        imap.end();
                                        resolve(allReservations);
                                    }
                                    return;
                                }
                                
                                console.log('📝 Contenu complet du mail :\n', rawText);
                                
                                // Traitement de l'email
                                processEmail(parsed)
                                    .then(plans => {
                                        console.log('📦 Plans détectés:', JSON.stringify(plans, null, 2));
                                        allReservations.push(...plans);
                                        
                                        processedCount++;
                                        if (processedCount === results.length) {
                                            console.log('📬 Fin de la récupération des emails');
                                            imap.end();
                                            resolve(allReservations);
                                        }
                                        console.log('✅ Traitement terminé');
                                    })
                                    .catch(error => {
                                        console.error('Erreur lors du traitement de l\'email:', error);
                                        processedCount++;
                                        if (processedCount === results.length) {
                                            imap.end();
                                            resolve(allReservations);
                                        }
                                    });
                            });
                        });
                    });
                });
            });
        });
        
        imap.once('error', (err) => {
            console.error('❌ Erreur IMAP:', err);
            reject(err);
        });
        
        imap.once('end', () => {
            console.log('📬 Connexion IMAP fermée');
        });
        
        imap.connect();
    });
}

// Exécuter le script
checkEmails()
    .then(reservations => {
        console.log('Résultat de checkEmails:', reservations);
        if (reservations && Array.isArray(reservations)) {
            console.log(`${reservations.length} réservations traitées avec succès`);
        } else {
            console.log('Aucune réservation traitée (résultat non défini ou non tableau)');
        }
        process.exit(0);
    })
    .catch(error => {
        console.error('Erreur:', error);
        process.exit(1);
    }); 