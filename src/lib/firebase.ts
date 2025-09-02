import { initializeApp, getApps } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase only if it hasn't been initialized already
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore
export const db = getFirestore(app);

// Connect to emulators in development
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Only connect to emulators if not already connected
  try {
    if (!auth._delegate._config?.emulator) {
      // connectAuthEmulator(auth, 'http://localhost:9099');
    }
    // if (!db._delegate._databaseId?.database?.includes('localhost')) {
    //   connectFirestoreEmulator(db, 'localhost', 8080);
    // }
  } catch (error) {
    // Emulators might already be connected
    console.log('Firebase emulators already connected or not available');
  }
}

export { app };
export default firebaseConfig;