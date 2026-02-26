// lib/activityLogger.ts
/**
 * Helper to log activities to the activity_logs collection
 */

export type ActivityType = 'user' | 'application' | 'property' | 'system' | 'auth' | 'billing'
export type ActivityAction = string

interface LogActivityParams {
  type: ActivityType
  action: ActivityAction
  userId?: string
  userName?: string
  userEmail?: string
  entityType?: string
  entityId?: string
  actorId?: string
  actorEmail?: string
  actorRole?: string
  metadata?: Record<string, any>
}

async function writeActivityToFirestore(params: LogActivityParams): Promise<void> {
  const { getAdminDb } = await import('@/lib/firebaseAdmin')
  const adminDb = getAdminDb()
  if (!adminDb) throw new Error('Admin SDK not configured')

  await adminDb.collection('activity_logs').add({
    ...params,
    timestamp: new Date(),
    createdAt: new Date(),
  })
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    if (typeof window === 'undefined') {
      await writeActivityToFirestore(params)
      return
    }

    await fetch('/api/admin/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
  } catch (error) {
    // Non-fatal - just log to console
    console.debug('Activity log failed:', error)
  }
}

// Convenience functions
export const ActivityLogger = {
  // Generic log method for flexible logging
  log: (params: {
    type: string
    action: string
    userId?: string
    userName?: string
    userEmail?: string
    entityType?: string
    entityId?: string
    actorId?: string
    actorEmail?: string
    actorRole?: string
    metadata?: Record<string, any>
  }) => logActivity(params as LogActivityParams),

  userCreated: (userEmail: string, userName: string, role: string) =>
    logActivity({
      type: 'user',
      action: 'created',
      userName,
      userEmail,
      metadata: { role }
    }),

  userUpdated: (userId: string, userName: string, changes: Record<string, any>) =>
    logActivity({
      type: 'user',
      action: 'updated',
      userId,
      userName,
      metadata: { changes }
    }),

  applicationApproved: (applicationId: string, applicantEmail: string, applicantName: string, type: string, code?: string) =>
    logActivity({
      type: 'application',
      action: 'approved',
      userEmail: applicantEmail,
      userName: applicantName,
      metadata: { applicationId, type, code }
    }),

  applicationRejected: (applicationId: string, applicantEmail: string, applicantName: string, type: string) =>
    logActivity({
      type: 'application',
      action: 'rejected',
      userEmail: applicantEmail,
      userName: applicantName,
      metadata: { applicationId, type }
    }),

  propertyCreated: (propertyId: string, agentId: string, agentName: string, title: string) =>
    logActivity({
      type: 'property',
      action: 'created',
      userId: agentId,
      userName: agentName,
      metadata: { propertyId, title }
    }),

  authSync: (adminEmail: string, created: number, updated: number) =>
    logActivity({
      type: 'auth',
      action: 'sync',
      userEmail: adminEmail,
      metadata: { created, updated }
    }),

  adminLogin: (adminEmail: string, adminName?: string) =>
    logActivity({
      type: 'auth',
      action: 'login',
      userEmail: adminEmail,
      userName: adminName,
      metadata: { role: 'admin' }
    }),

  inviteSent: (userId: string, userEmail: string, role: string) =>
    logActivity({
      type: 'user',
      action: 'invite_sent',
      userId,
      userEmail,
      entityType: 'user',
      entityId: userId,
      metadata: { role }
    }),

  inviteAccepted: (userId: string, userEmail: string, role: string) =>
    logActivity({
      type: 'user',
      action: 'invite_accepted',
      userId,
      userEmail,
      entityType: 'user',
      entityId: userId,
      metadata: { role }
    }),

  leadAssigned: (leadId: string, assigneeId: string, assigneeName?: string) =>
    logActivity({
      type: 'system',
      action: 'lead_assigned',
      entityType: 'lead',
      entityId: leadId,
      userId: assigneeId,
      userName: assigneeName,
      metadata: { assigneeId }
    }),
}
