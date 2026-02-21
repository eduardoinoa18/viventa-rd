import { FieldValue } from 'firebase-admin/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import type { MasterRole } from '@/lib/auth/session'

export async function logAdminAction({
  actorUid,
  actorRole,
  action,
  targetType,
  targetId,
  metadata,
}: {
  actorUid: string
  actorRole: MasterRole
  action: string
  targetType: string
  targetId: string
  metadata?: Record<string, unknown>
}) {
  const db = getAdminDb()
  if (!db) return

  await db.collection('admin_audit_logs').add({
    actorUid,
    actorRole,
    action,
    targetType,
    targetId,
    metadata: metadata || {},
    createdAt: FieldValue.serverTimestamp(),
  })
}
