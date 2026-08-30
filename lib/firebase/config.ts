import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

/**
 * VVU Firebase configuration.
 * Loads from environment variables. If vars are absent, the app runs
 * in offline/degraded mode — components should handle gracefully.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

const hasConfig = firebaseConfig.apiKey && firebaseConfig.projectId;

if (hasConfig && !getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} else if (getApps().length) {
  app = getApps()[0];
  db = getFirestore(app);
}

export { app, db };
export default firebaseConfig;
