/**
 * Firebase Server-side Initialization Utility
 * 
 * Consolidates Firebase Admin SDK initialization for server routes.
 * Eliminates duplication across multiple API routes and server components.
 * 
 * Usage:
 *   const db = getServerDb()
 *   const auth = getServerAuth()
 */

import { getAdminDb, getAdminAuth } from './firebaseAdmin'

/**
 * Get Firestore database with validation
 * Throws error if Admin SDK not configured
 */
export function getServerDb() {
  const db = getAdminDb()
  if (!db) {
    throw new Error('Firebase Admin Firestore not configured. Ensure FIREBASE_ADMIN_* environment variables are set.')
  }
  return db
}

/**
 * Get Firebase Admin Auth with validation
 * Throws error if Admin SDK not configured
 */
export function getServerAuth() {
  const auth = getAdminAuth()
  if (!auth) {
    throw new Error('Firebase Admin Auth not configured. Ensure FIREBASE_ADMIN_* environment variables are set.')
  }
  return auth
}

/**
 * Get both database and auth in one call
 * Useful for routes that need both
 */
export function getServerFirebase() {
  return {
    db: getServerDb(),
    auth: getServerAuth(),
  }
}

/**
 * Utility to check if Firebase is configured without throwing
 */
export function isFirebaseConfigured(): boolean {
  try {
    getServerDb()
    getServerAuth()
    return true
  } catch {
    return false
  }
}
