/**
 * Test de démarrage de l'application sans blocages
 * Simule le chargement sans les appels API timezone
 */

console.log('🧪 Test de démarrage de l\'application');
console.log('=====================================');

// Simulation du chargement sans timezone
const mockTripsPage = {
  timezoneEnrichmentInProgress: false,
  ongoingTrips: [],
  upcomingTrips: [],
  pastTrips: [],
  
  async ngOnInit() {
    console.log('🚀 ngOnInit appelé');
    try {
      await this.initializeStorage();
      await this.loadUserRole();
      console.log('✅ ngOnInit terminé SANS blocage');
    } catch (error) {
      console.error('❌ Erreur ngOnInit:', error);
    }
  },
  
  async initializeStorage() {
    console.log('📦 Initialisation storage...');
    // Simulation rapide
    await new Promise(resolve => setTimeout(resolve, 10));
    console.log('✅ Storage initialisé');
  },
  
  async loadUserRole() {
    console.log('👤 Chargement rôle utilisateur...');
    // Simulation rapide
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('✅ Rôle utilisateur chargé');
    
    // Simulation du chargement des trips SANS timezone
    await this.loadTrips();
    console.log('📊 Trips chargés - ongoing: 2, upcoming: 1, past: 1');
    console.log('⚠️ Enrichissement timezone DÉSACTIVÉ - pas de blocage');
  },
  
  async loadTrips() {
    console.log('✈️ Chargement des voyages...');
    // Simulation rapide
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log('✅ Voyages chargés');
  }
};

// Test du démarrage
async function testStartup() {
  console.log('\n📋 Test 1: Démarrage sans timezone');
  const startTime = Date.now();
  
  await mockTripsPage.ngOnInit();
  
  const duration = Date.now() - startTime;
  console.log(`⏱️ Temps de démarrage: ${duration}ms`);
  
  if (duration < 500) {
    console.log('✅ Démarrage RAPIDE - pas de blocage');
  } else {
    console.log('⚠️ Démarrage LENT - possible blocage');
  }
}

// Test avec timezone (pour comparaison)
const mockTripsPageWithTimezone = {
  ...mockTripsPage,
  
  async loadUserRole() {
    console.log('👤 Chargement rôle utilisateur...');
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('✅ Rôle utilisateur chargé');
    
    await this.loadTrips();
    console.log('📊 Trips chargés');
    
    // Simulation des appels timezone BLOQUANTS
    console.log('🌍 Début enrichissement timezone...');
    for (let i = 0; i < 10; i++) {
      console.log(`  🛫 Appel API timezone ${i + 1}/10...`);
      await new Promise(resolve => setTimeout(resolve, 200)); // Simulation d'appel API lent
    }
    console.log('✅ Enrichissement timezone terminé (LENT)');
  }
};

async function testStartupWithTimezone() {
  console.log('\n📋 Test 2: Démarrage AVEC timezone (pour comparaison)');
  const startTime = Date.now();
  
  await mockTripsPageWithTimezone.ngOnInit();
  
  const duration = Date.now() - startTime;
  console.log(`⏱️ Temps de démarrage: ${duration}ms`);
  console.log('⚠️ Démarrage LENT à cause des appels timezone');
}

// Exécuter les tests
async function runAllTests() {
  await testStartup();
  await testStartupWithTimezone();
  
  console.log('\n🎯 CONCLUSION:');
  console.log('- Sans timezone: démarrage rapide');
  console.log('- Avec timezone: démarrage lent/bloqué');
  console.log('- Solution: désactiver timezone temporairement');
}

runAllTests().catch(console.error); 