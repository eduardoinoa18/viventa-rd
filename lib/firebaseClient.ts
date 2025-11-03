import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getFunctions, Functions } from "firebase/functions";
import { getMessaging, Messaging, isSupported } from "firebase/messaging";

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

// Initialize Firebase on both client and server
let app: any = null;
let _db: any = null;
let _auth: any = null;
let _storage: any = null;
let _functions: any = null;
let _messaging: Messaging | null = null;

function initializeFirebase() {
  if (app) return; // Already initialized

  if (isFirebaseConfigValid()) {
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
        console.log('✓ Firebase initialized');
      } else {
        app = getApps()[0];
      }
      // Firestore can be accessed in SSR for read-only operations, but guard if needed
      try { _db = getFirestore(app); } catch {}
      // Only initialize browser-only SDKs in the client
      if (typeof window !== 'undefined') {
        try { _auth = getAuth(app); } catch {}
        try { _storage = getStorage(app); } catch {}
        try { _functions = getFunctions(app); } catch {}
        // Messaging requires browser support check
        isSupported().then(supported => {
          if (supported) {
            try { _messaging = getMessaging(app); } catch {}
          }
        }).catch(() => {})
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
    }
  } else {
    console.warn('⚠️ Firebase configuration is incomplete. Please set all NEXT_PUBLIC_FIREBASE_* environment variables.');
  }
}

// Initialize once (both server and client)
initializeFirebase();

export const db = _db;
export const auth = _auth;
export const storage = _storage;
export const functions = _functions;
export const messaging = _messaging;
export const isFirebaseConfigured = isFirebaseConfigValid();

// Helper to get messaging instance (async due to isSupported check)
export async function getMessagingInstance(): Promise<Messaging | null> {
  if (_messaging) return _messaging;
  if (typeof window === 'undefined') return null;
  const supported = await isSupported();
  if (!supported || !app) return null;
  try {
    _messaging = getMessaging(app);
    return _messaging;
  } catch {
    return null;
  }
}
