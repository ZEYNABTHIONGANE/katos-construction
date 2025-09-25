import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import Constants from 'expo-constants';

// Configuration Firebase depuis les variables d'environnement
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};

// Initialiser Firebase (éviter la double initialisation)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Services Firebase
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Émulateurs pour le développement (si défini)
if (__DEV__ && Constants.expoConfig?.extra?.useFirebaseEmulators) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectStorageEmulator(storage, 'localhost', 9199);
  } catch (error) {
    console.log('Emulators already connected');
  }
}

export { app };
export default app;