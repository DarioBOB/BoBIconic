// Génère dynamiquement des données démo (offline, multilingue, toujours valides)
export function getDemoData(lang: 'fr' | 'en' = 'fr') {
  const now = new Date();
  const addDays = (date: Date, days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  // Utilisateur démo
  const user = {
    uid: 'guest-demo',
    email: 'guest@bob-demo.com',
    firstName: { fr: 'Invité', en: 'Guest' },
    lastName: { fr: 'Démo', en: 'Demo' },
    preferredLang: lang,
    createdAt: new Date('2023-01-01T10:00:00Z').toISOString(),
    lastLogin: now.toISOString()
  };

  // Voyages
  const pastStart = addDays(now, -15);
  const pastEnd = addDays(now, -10);
  const ongoingStart = addDays(now, -2);
  const ongoingEnd = addDays(now, 3);
  const futureStart = addDays(now, 10);
  const futureEnd = addDays(now, 15);

  const trips = [
    {
      id: 'trip-past',
      title: { fr: 'Voyage passé à Barcelone', en: 'Past trip to Barcelona' },
      startDate: pastStart.toISOString(),
      endDate: pastEnd.toISOString(),
      plans: [
        {
          id: 'plan1',
          type: 'flight',
          title: { fr: 'Vol Paris → Barcelone', en: 'Flight Paris → Barcelona' },
          startDate: addDays(pastStart, 0).toISOString(),
          endDate: addDays(pastStart, 0).toISOString(),
          details: { from: 'Paris', to: 'Barcelone', company: 'Air France', callsign: '' }
        },
        {
          id: 'plan2',
          type: 'hotel',
          title: { fr: 'Hôtel Ramblas', en: 'Ramblas Hotel' },
          startDate: addDays(pastStart, 0).toISOString(),
          endDate: addDays(pastEnd, 0).toISOString(),
          details: { address: 'La Rambla, Barcelone' }
        }
      ]
    },
    {
      id: 'trip-ongoing',
      title: { fr: 'Voyage en cours à Rome', en: 'Ongoing trip in Rome' },
      startDate: ongoingStart.toISOString(),
      endDate: ongoingEnd.toISOString(),
      plans: [
        {
          id: 'plan3',
          type: 'flight',
          title: { fr: 'Vol Genève → Rome', en: 'Flight Geneva → Rome' },
          startDate: addDays(ongoingStart, 0).toISOString(),
          endDate: addDays(ongoingStart, 0).toISOString(),
          details: { from: 'Genève', to: 'Rome', company: 'EasyJet', callsign: '' }
        },
        {
          id: 'plan4',
          type: 'activity',
          title: { fr: 'Visite du Colisée', en: 'Colosseum visit' },
          startDate: addDays(ongoingStart, 1).toISOString(),
          endDate: addDays(ongoingStart, 1).toISOString(),
          details: { location: 'Colisée' }
        }
      ]
    },
    {
      id: 'trip-future',
      title: { fr: 'Voyage à venir à Montréal', en: 'Upcoming trip to Montreal' },
      startDate: futureStart.toISOString(),
      endDate: futureEnd.toISOString(),
      plans: [
        {
          id: 'plan5',
          type: 'flight',
          title: { fr: 'Vol Lyon → Montréal', en: 'Flight Lyon → Montreal' },
          startDate: addDays(futureStart, 0).toISOString(),
          endDate: addDays(futureStart, 0).toISOString(),
          details: { from: 'Lyon', to: 'Montréal', company: 'Air Canada', callsign: '' }
        },
        {
          id: 'plan6',
          type: 'hotel',
          title: { fr: 'Hôtel Vieux-Montréal', en: 'Old Montreal Hotel' },
          startDate: addDays(futureStart, 0).toISOString(),
          endDate: addDays(futureEnd, 0).toISOString(),
          details: { address: 'Rue Saint-Paul, Montréal' }
        }
      ]
    }
  ];

  return { user, trips };
} 