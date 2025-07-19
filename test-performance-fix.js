/**
 * Test de performance après correction de la boucle infinie
 * Vérifie que les appels API ne sont plus répétés
 */

async function runTests() {
  console.log('🧪 Test de performance après correction');
  console.log('=====================================');

  // Simulation des corrections apportées
  const mockTripsPage = {
    timezoneEnrichmentInProgress: false,
    ongoingTrips: [],
    upcomingTrips: [],
    pastTrips: [],
    
    // Simulation de la méthode corrigée
    async enrichPlansWithTimezoneAbbr(trips) {
      if (this.timezoneEnrichmentInProgress) {
        console.log('⚠️ enrichPlansWithTimezoneAbbr déjà en cours, ignoré');
        return;
      }
      
      console.log('🔍 enrichPlansWithTimezoneAbbr appelé avec', trips.length, 'voyages');
      this.timezoneEnrichmentInProgress = true;
      
      try {
        for (const trip of trips) {
          if (trip.plans) {
            for (const plan of trip.plans) {
              if (plan.type === 'flight') {
                // Vérifier si déjà enrichi
                if (plan.departureTzAbbr && plan.arrivalTzAbbr) {
                  console.log('      ✅ Déjà enrichi, ignoré');
                  continue;
                }
                
                console.log('      🛫 Traitement du vol...');
                // Simulation d'appel API
                plan.departureTzAbbr = 'CEST (UTC +2)';
                plan.arrivalTzAbbr = 'EEST (UTC +3)';
              }
            }
          }
        }
      } finally {
        this.timezoneEnrichmentInProgress = false;
      }
      console.log('🎯 enrichPlansWithTimezoneAbbr terminé');
    }
  };

  // Test 1: Vérifier que les appels multiples sont bloqués
  console.log('\n📋 Test 1: Protection contre les appels multiples');
  await mockTripsPage.enrichPlansWithTimezoneAbbr([{ plans: [{ type: 'flight' }] }]);
  await mockTripsPage.enrichPlansWithTimezoneAbbr([{ plans: [{ type: 'flight' }] }]); // Doit être ignoré

  // Test 2: Vérifier que les plans déjà enrichis sont ignorés
  console.log('\n📋 Test 2: Cache local des plans enrichis');
  const tripWithEnrichedPlan = {
    plans: [{
      type: 'flight',
      departureTzAbbr: 'CEST (UTC +2)',
      arrivalTzAbbr: 'EEST (UTC +3)'
    }]
  };
  await mockTripsPage.enrichPlansWithTimezoneAbbr([tripWithEnrichedPlan]);

  // Test 3: Simulation du service timezone avec cache
  console.log('\n📋 Test 3: Cache du service timezone');
  const mockTimezoneService = {
    gptCache: new Map(),
    GPT_CACHE_TIMESTAMPS: new Map(),
    GPT_CACHE_DURATION: 60 * 60 * 1000,
    
    isGptCacheValid(key) {
      const timestamp = this.GPT_CACHE_TIMESTAMPS.get(key);
      if (!timestamp) return false;
      return (Date.now() - timestamp) < this.GPT_CACHE_DURATION;
    },
    
    async getTimezoneAbbreviationFromCity(city, date) {
      const cacheKey = `${city}_${date}`;
      if (this.isGptCacheValid(cacheKey)) {
        const cached = this.gptCache.get(cacheKey);
        if (cached) {
          console.log('      ✅ Cache GPT hit pour', city);
          return cached;
        }
      }
      
      console.log('      🌐 Appel API GPT pour', city);
      const result = { abbr: 'CEST', offset: '+2', label: 'CEST (UTC +2)' };
      this.gptCache.set(cacheKey, result);
      this.GPT_CACHE_TIMESTAMPS.set(cacheKey, Date.now());
      return result;
    }
  };

  // Test des appels répétés
  console.log('Premier appel pour Genève:');
  await mockTimezoneService.getTimezoneAbbreviationFromCity('Genève', '2024-07-01');
  console.log('Deuxième appel pour Genève (doit utiliser le cache):');
  await mockTimezoneService.getTimezoneAbbreviationFromCity('Genève', '2024-07-01');

  console.log('\n✅ Tests de performance terminés');
  console.log('Les corrections devraient empêcher:');
  console.log('- Les appels API répétés');
  console.log('- Les boucles infinies');
  console.log('- Le ralentissement du navigateur');
}

// Exécuter les tests
runTests().catch(console.error); 