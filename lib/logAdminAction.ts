import { getAdminDb } from './firebaseAdmin'
import { FieldValue, Timestamp, Query } from 'firebase-admin/firestore'

/**
 * Audit log entry for admin actions
 * 
 * This is the single source of truth for:
 * - Who did what
 * - When they did it
 * - What the outcome was
 * - Full context for compliance/investigation
 */

export interface AdminActionLog {
  actor: string // Always email from verified session, never from request
  action: string // e.g., 'firebase_cleanup', 'user_delete', 'settings_update'
  target: string // e.g., 'auth_users', 'firestore_properties', 'settings'
  metadata?: Record<string, any> // Action-specific context
  result?: 'success' | 'failed' // Outcome
  error?: string // Error message if failed
  timestamp?: any // Server timestamp
}

/**
 * Log an admin action to Firestore audit_logs collection
 * 
 * This is the canonical way to record ALL admin operations
 * Usage:
 *   await logAdminAction({
 *     actor: admin.email,
 *     action: 'firebase_cleanup',
 *     target: 'auth_users',
 *     metadata: { collections, deleteAuth }
 *   })
 */
export async function logAdminAction(
  entry: AdminActionLog
): Promise<string> {
  const db = getAdminDb()
  if (!db) {
    console.error('Cannot log admin action: Firebase Admin not configured')
    return ''
  }

  try {
    const auditEntry = {
      actor: entry.actor, // Must be verified from session, never user-supplied
      action: entry.action,
      target: entry.target,
      metadata: entry.metadata || {},
      result: entry.result || 'success',
      error: entry.error,
      timestamp: FieldValue.serverTimestamp(),
      // Useful indexes
      actorEmail: entry.actor.toLowerCase(),
      actionType: entry.action,
    }

    const docRef = await db.collection('audit_logs').add(auditEntry)
    return docRef.id
  } catch (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - audit logging failure shouldn't cause API failure
    // But DO log it so we know there's a problem
    return ''
  }
}

/**
 * Helper to wrap admin actions with automatic logging
 * 
 * Usage:
 *   const result = await withAuditLog({
 *     actor: admin.email,
 *     action: 'user_delete',
 *     target: 'auth_users',
 *   }, async () => {
 *     // Your action code here
 *     await deleteUser(userId)
 *   })
 */
export async function withAuditLog<T>(
  entry: Omit<AdminActionLog, 'result' | 'error'>,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const result = await fn()
    // Log success
    await logAdminAction({
      ...entry,
      result: 'success',
    })
    return result
  } catch (error) {
    // Log failure with error message
    const errorMessage = error instanceof Error ? error.message : String(error)
    await logAdminAction({
      ...entry,
      result: 'failed',
      error: errorMessage,
    })
    // Re-throw the original error
    throw error
  }
}

/**
 * Query audit logs for specific actor
 * Useful for compliance/investigation
 */
export async function getAuditLogs(
  filters?: {
    actor?: string
    action?: string
    target?: string
    limitDays?: number
  }
): Promise<AdminActionLog[]> {
  const db = getAdminDb()
  if (!db) return []

  try {
    let collection = db.collection('audit_logs')
    let whereConditions: Array<[string, '==' | '<=' | '>=' | '<' | '>' | '!=', any]> = []

    if (filters?.actor) {
      whereConditions.push(['actorEmail', '==', filters.actor.toLowerCase()])
    }
    if (filters?.action) {
      whereConditions.push(['actionType', '==', filters.action])
    }
    if (filters?.target) {
      whereConditions.push(['target', '==', filters.target])
    }
    if (filters?.limitDays) {
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - filters.limitDays)
      whereConditions.push(['timestamp', '>=', Timestamp.fromDate(cutoff)])
    }

    // Build query with all where conditions
    let query: any = collection
    for (const [field, op, value] of whereConditions) {
      query = query.where(field, op, value)
    }

    const snapshot = await query.orderBy('timestamp', 'desc').limit(100).get()
    return snapshot.docs.map((doc) => doc.data() as AdminActionLog)
  } catch (error) {
    console.error('Failed to query audit logs:', error)
    return []
  }
}
