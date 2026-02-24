// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert, type App } from 'firebase-admin/app'
import { getFirestore as getAdminFirestore, type Firestore } from 'firebase-admin/firestore'
import { getAuth as getAdminAuthImpl, type Auth } from 'firebase-admin/auth'

let adminApp: App | null = null
let adminDb: Firestore | null = null
let adminAuth: Auth | null = null

function buildCertFromEnv() {
  // Preferred: FIREBASE_SERVICE_ACCOUNT (base64 or raw JSON)
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT
  if (sa) {
    try {
      const raw = isProbablyBase64(sa) ? Buffer.from(sa, 'base64').toString('utf8') : sa
      const json = JSON.parse(raw)
      if (json.project_id && json.client_email && json.private_key) {
        return {
          projectId: json.project_id as string,
          clientEmail: json.client_email as string,
          privateKey: (json.private_key as string).replace(/\\n/g, '\n'),
        }
      }
    } catch {
      // fall through to legacy envs
    }
  }

  // Legacy: split env vars
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

function isProbablyBase64(s: string) {
  // heuristic: base64 will be long and contain only base64 chars
  return /^[A-Za-z0-9+/=]+$/.test(s) && s.length > 100
}

export function getAdminDb(): Firestore | null {
  try {
    if (adminDb) return adminDb
    const cred = buildCertFromEnv()
    if (!cred) {
      console.error('[ADMIN] Firebase Admin credentials not found in environment')
      return null
    }
    if (!getApps().length) {
      adminApp = initializeApp({ credential: cert(cred) })
    }
    adminDb = getAdminFirestore()
    return adminDb
  } catch (error: any) {
    console.error('[ADMIN] Failed to initialize Admin Firestore:', error?.message)
    return null
  }
}

export function getAdminAuth(): Auth | null {
  try {
    if (adminAuth) return adminAuth
    const cred = buildCertFromEnv()
    if (!cred) {
      console.error('[ADMIN] Firebase Admin credentials not found in environment')
      return null
    }
    if (!getApps().length) {
      adminApp = initializeApp({ credential: cert(cred) })
    }
    adminAuth = getAdminAuthImpl()
    return adminAuth
  } catch (error: any) {
    console.error('[ADMIN] Failed to initialize Admin Auth:', error?.message)
    return null
  }
}
