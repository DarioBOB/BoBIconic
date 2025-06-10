const { fetchFlight } = require('flightradar24-client');

async function enrichFlightSegmentWithFR24(segment) {
    try {
        let flightNumber = (segment.flight_number || segment.flightNumber || '').replace(/\s+/g, '').toUpperCase();
        if (!flightNumber) return segment;
        if (!/^[A-Z0-9]{2,6}$/.test(flightNumber)) return segment;

        const flight = await fetchFlight(flightNumber);
        if (!flight) return segment;

        return {
            ...segment,
            aircraft: flight.model || segment.aircraft || '',
            departure_airport_code: flight.origin?.id || segment.departure_airport_code || '',
            arrival_airport_code: flight.destination?.id || segment.arrival_airport_code || '',
            departure_timezone: flight.origin?.timezone || segment.departure_timezone || '',
            arrival_timezone: flight.destination?.timezone || segment.arrival_timezone || '',
        };
    } catch (error) {
        console.error('Erreur enrichissement FR24 :', error);
        return segment;
    }
}

module.exports = { enrichFlightSegmentWithFR24 }; 