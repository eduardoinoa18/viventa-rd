// Minimal Firebase client wiring. Requires NEXT_PUBLIC_* env vars in .env.local
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let _auth: any = null
let _firestore: any = null
let _storage: any = null

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    initializeApp(firebaseConfig)
  }
  _auth = getAuth()
  _firestore = getFirestore()
  _storage = getStorage()
}

export const auth = _auth
export const firestore = _firestore
export const storage = _storage
