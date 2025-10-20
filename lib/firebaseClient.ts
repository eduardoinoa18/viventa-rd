import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _db: any = null
let _auth: any = null
let _storage: any = null
let _functions: any = null

if (typeof window !== 'undefined') {
  if(!getApps().length) initializeApp(firebaseConfig);
  _db = getFirestore();
  _auth = getAuth();
  _storage = getStorage();
  _functions = getFunctions();
}

export const db = _db
export const auth = _auth
export const storage = _storage
export const functions = _functions
