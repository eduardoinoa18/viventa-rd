/**
 * Secure Session Management
 * Uses Firebase Admin Session Cookies (httpOnly)
 * NO client-side token storage
 */

import { cookies } from 'next/headers'
import { getAdminAuth } from '../firebaseAdmin'

export interface ImpersonationSessionMetadata {
  active: boolean
  adminId: string
  adminEmail: string
  startedAt: number
}

export interface UserSession {
  uid: string
  email: string | null
  role: 'master_admin' | 'admin' | 'buyer' | 'user' | 'agent' | 'broker' | 'constructora'
  twoFactorVerified: boolean
  impersonation: ImpersonationSessionMetadata | null
  customClaims: Record<string, any>
}

function normalizeSessionRole(rawRole: unknown): UserSession['role'] {
  const role = String(rawRole || '').trim().toLowerCase()
  if (role === 'master_admin' || role === 'master-admin' || role === 'masteradmin') return 'master_admin'
  if (role === 'admin' || role === 'administrator') return 'admin'
  if (role === 'agent') return 'agent'
  if (role === 'broker') return 'broker'
  if (role === 'constructora' || role === 'developer') return 'constructora'
  if (role === 'user') return 'user'
  return 'buyer'
}

function extractImpersonation(decodedClaims: Record<string, any>): ImpersonationSessionMetadata | null {
  const raw = decodedClaims?.impersonation
  if (!raw || typeof raw !== 'object') return null

  const active = raw.active === true
  const adminId = String(raw.adminId || '').trim()
  const adminEmail = String(raw.adminEmail || '').trim().toLowerCase()
  const startedAt = Number(raw.startedAt || 0)

  if (!active || !adminId || !adminEmail || !Number.isFinite(startedAt) || startedAt <= 0) {
    return null
  }

  return { active, adminId, adminEmail, startedAt }
}

/**
 * Get current user session from httpOnly cookie
 * Server-side only (uses Next.js cookies())
 */
export async function getServerSession(): Promise<UserSession | null> {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('__session')?.value

  if (!sessionCookie) {
    return null
  }

  const adminAuth = getAdminAuth()
  if (!adminAuth) {
    console.error('Admin Auth not initialized')
    return null
  }

  try {
    // Verify session cookie (NOT ID token)
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || null,
      role: normalizeSessionRole(decodedClaims.role),
      twoFactorVerified: decodedClaims.twoFactorVerified === true,
      impersonation: extractImpersonation(decodedClaims as Record<string, any>),
      customClaims: decodedClaims,
    }
  } catch (error) {
    console.error('Session verification failed:', error)
    return null
  }
}

/**
 * Get session from middleware request
 * Middleware-compatible version
 */
export async function getSessionFromRequest(req: Request): Promise<UserSession | null> {
  const cookieHeader = req.headers.get('cookie')
  if (!cookieHeader) return null

  // Parse cookie header manually
  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  const sessionCookie = cookies['__session']
  if (!sessionCookie) return null

  const adminAuth = getAdminAuth()
  if (!adminAuth) {
    console.error('Admin Auth not initialized')
    return null
  }

  try {
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true)

    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email || null,
      role: normalizeSessionRole(decodedClaims.role),
      twoFactorVerified: decodedClaims.twoFactorVerified === true,
      impersonation: extractImpersonation(decodedClaims as Record<string, any>),
      customClaims: decodedClaims,
    }
  } catch {
    return null
  }
}

/**
 * Create session cookie from Firebase ID token
 * Returns cookie value and metadata
 */
export async function createSessionCookie(idToken: string, expiresInMs: number = 5 * 24 * 60 * 60 * 1000) {
  const adminAuth = getAdminAuth()
  if (!adminAuth) {
    throw new Error('Admin Auth not initialized')
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: expiresInMs,
  })

  return {
    value: sessionCookie,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: expiresInMs / 1000,
      path: '/',
    },
  }
}

/**
 * Clear session cookie (logout)
 */
export function clearSessionCookie() {
  const cookieStore = cookies()
  cookieStore.delete('__session')
}
