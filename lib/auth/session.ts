import { cookies } from 'next/headers'
import { getAdminAuth, getAdminDb } from '../firebaseAdmin'

export type MasterRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT'

export type MasterSession = {
  uid: string
  email: string
  role: MasterRole
}

function normalizeRole(value: unknown): MasterRole | null {
  const raw = String(value || '').trim().toUpperCase()
  if (raw === 'SUPER_ADMIN' || raw === 'ADMIN' || raw === 'SUPPORT') return raw
  if (raw === 'MASTER_ADMIN') return 'SUPER_ADMIN'
  if (raw === 'ADMIN' || raw === 'MASTER') return 'ADMIN'
  return null
}

async function resolveRoleFromDb(uid: string): Promise<MasterRole | null> {
  const db = getAdminDb()
  if (!db) return null
  try {
    const userSnap = await db.collection('users').doc(uid).get()
    if (!userSnap.exists) return null
    return normalizeRole(userSnap.data()?.role)
  } catch {
    return null
  }
}

async function decodeFromToken(token: string) {
  const adminAuth = getAdminAuth()
  if (!adminAuth) return null

  try {
    return await adminAuth.verifySessionCookie(token, true)
  } catch {
    try {
      return await adminAuth.verifyIdToken(token, true)
    } catch {
      return null
    }
  }
}

export async function getMasterSession(): Promise<MasterSession | null> {
  const token = cookies().get('__session')?.value
  if (!token) return null

  const decoded = await decodeFromToken(token)
  if (!decoded?.uid) return null

  const claimRole = normalizeRole((decoded as any).role || (decoded as any)?.claims?.role)
  const role = claimRole || await resolveRoleFromDb(decoded.uid)
  if (!role) return null

  const email = decoded.email || ''
  if (!email) return null

  return { uid: decoded.uid, email, role }
}
