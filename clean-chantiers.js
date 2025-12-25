// Script pour supprimer tous les chantiers existants
// À exécuter depuis la console Firebase ou via un script Node.js

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

const firebaseConfig = {
  // Configuration Firebase - remplacez par votre config
  apiKey: "votre-api-key",
  authDomain: "votre-project.firebaseapp.com",
  projectId: "katos-construction",
  storageBucket: "katos-construction.appspot.com",
  messagingSenderId: "123456789",
  appId: "votre-app-id"
};

async function deleteAllChantiers() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  try {
    console.log('🔍 Récupération de tous les chantiers...');
    const chantiersRef = collection(db, 'chantiers');
    const snapshot = await getDocs(chantiersRef);

    console.log(`📊 Trouvé ${snapshot.size} chantier(s) à supprimer`);

    const deletePromises = [];
    snapshot.forEach((docSnapshot) => {
      console.log(`🗑️ Suppression du chantier: ${docSnapshot.id}`);
      deletePromises.push(deleteDoc(doc(db, 'chantiers', docSnapshot.id)));
    });

    await Promise.all(deletePromises);
    console.log('✅ Tous les chantiers ont été supprimés avec succès!');
    console.log('💡 Vous pouvez maintenant créer de nouveaux chantiers avec la structure mise à jour.');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
  }
}

// Décommenter la ligne suivante pour exécuter
// deleteAllChantiers();

console.log(`
🚨 ATTENTION: Ce script supprimera TOUS les chantiers existants!

Pour l'exécuter:
1. Installez firebase: npm install firebase
2. Mettez à jour la configuration Firebase ci-dessus
3. Décommentez la dernière ligne
4. Exécutez: node clean-chantiers.js

Ou supprimez manuellement depuis la console Firebase:
https://console.firebase.google.com/project/katos-construction/firestore
`);