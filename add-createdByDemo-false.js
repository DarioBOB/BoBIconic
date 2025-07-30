const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBQ876_Ci6AWLBV5-nmkqLDKnCI3929v0E",
  authDomain: "bob-app-9cbfe.firebaseapp.com",
  projectId: "bob-app-9cbfe",
  storageBucket: "bob-app-9cbfe.appspot.com",
  messagingSenderId: "163592997424",
  appId: "1:163592997424:web:ece12127e2e3f07a66bbf5",
  measurementId: "G-EMZ3P925JF"
};

async function addCreatedByDemoFalse() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  for (const coll of ['trips', 'plans']) {
    const snap = await getDocs(collection(db, coll));
    for (const docu of snap.docs) {
      const data = docu.data();
      if (data.createdByDemo === undefined) {
        await updateDoc(doc(db, coll, docu.id), { createdByDemo: false });
        console.log(`[MIGRATION] Ajout createdByDemo: false à ${coll}/${docu.id}`);
      }
    }
  }
  console.log('Migration terminée.');
}

addCreatedByDemoFalse().then(() => process.exit(0)); 