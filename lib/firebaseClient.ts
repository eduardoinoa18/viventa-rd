import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFunctions, Functions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
function isFirebaseConfigValid() {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.storageBucket &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId
  );
}

// Initialize Firebase only on client side
let app: any = null;
let _db: any = null;
let _auth: any = null;
let _storage: any = null;
let _functions: any = null;

function initializeFirebase() {
  if (typeof window === 'undefined') return;
  if (app) return; // Already initialized

  if (isFirebaseConfigValid()) {
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log('✓ Firebase initialized');
      } else {
        app = getApps()[0];
      }
      _db = getFirestore(app);
      _auth = getAuth(app);
      _storage = getStorage(app);
      _functions = getFunctions(app);
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  } else {
    console.warn('⚠️ Firebase configuration is incomplete. Please set all NEXT_PUBLIC_FIREBASE_* environment variables.');
  }
}

// Initialize on client side
if (typeof window !== 'undefined') {
  initializeFirebase();
}

export const db = _db;
export const auth = _auth;
export const storage = _storage;
export const functions = _functions;
export const isFirebaseConfigured = isFirebaseConfigValid();
