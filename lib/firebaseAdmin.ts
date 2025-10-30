// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth as getAdminAuthImpl, type Auth } from 'firebase-admin/auth'

let adminApp: App | null = null
let adminDb: Firestore | null = null
let adminAuth: Auth | null = null

function buildCertFromEnv() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey) return null

  // Handle escaped newlines in env-var
  privateKey = privateKey.replace(/\\n/g, '\n')

  return {
    projectId,
    clientEmail,
    privateKey,
  }
}

export function getAdminDb(): Firestore | null {
  try {
    if (adminDb) return adminDb
    const cred = buildCertFromEnv()
    if (!cred) return null
    if (!getApps().length) {
      adminApp = initializeApp({ credential: cert(cred) })
    }
    adminDb = getAdminFirestore()
    return adminDb
  } catch {
    return null
  }
}

export function getAdminAuth(): Auth | null {
  try {
    if (adminAuth) return adminAuth
    const cred = buildCertFromEnv()
    if (!cred) return null
    if (!getApps().length) {
      adminApp = initializeApp({ credential: cert(cred) })
    }
    adminAuth = getAdminAuthImpl()
    return adminAuth
  } catch {
    return null
  }
}
