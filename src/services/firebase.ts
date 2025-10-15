import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  connectAuthEmulator,
} from 'firebase/auth';
// Note: getReactNativePersistence est disponible dans firebase v9+
// Pour l'instant, utilisons une approche simplifiée
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type FirebaseExtraConfig = {
  firebaseApiKey?: string;
  firebaseAuthDomain?: string;
  firebaseProjectId?: string;
  firebaseStorageBucket?: string;
  firebaseMessagingSenderId?: string;
  firebaseAppId?: string;
  useFirebaseEmulators?: boolean;
};

const expoExtra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as FirebaseExtraConfig;

// Configuration Firebase depuis les variables d'environnement ou les extras Expo
const firebaseConfig = {
  apiKey: expoExtra.firebaseApiKey ?? process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: expoExtra.firebaseAuthDomain ?? process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: expoExtra.firebaseProjectId ?? process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: expoExtra.firebaseStorageBucket ?? process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    expoExtra.firebaseMessagingSenderId ?? process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: expoExtra.firebaseAppId ?? process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  console.warn('Firebase API key is missing. Check Expo extras or environment variables.');
}

// Initialiser Firebase (éviter la double initialisation)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialiser l'authentification
const initializeFirebaseAuth = () => {
  try {
    return getAuth(app);
  } catch (error) {
    console.warn('Firebase Auth initialization warning:', error);
    return getAuth(app);
  }
};

// Services Firebase
export const auth = initializeFirebaseAuth();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Émulateurs pour le développement (si défini)
const shouldUseEmulators =
  __DEV__ && (expoExtra.useFirebaseEmulators ?? process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true');

if (shouldUseEmulators) {
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
