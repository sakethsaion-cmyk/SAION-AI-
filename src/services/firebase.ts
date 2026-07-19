import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Detect if running on native app (Android/Electron)
const isNativeApp = typeof window !== 'undefined' && (
  !!(window as any).Capacitor?.isNativePlatform?.() ||
  navigator.userAgent.toLowerCase().includes('electron')
);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: isNativeApp
    ? import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
    : (import.meta.env.VITE_NETLIFY_URL || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email');

export default app;
