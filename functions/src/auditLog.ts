import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const logAdminAction = functions.firestore.document('audit_logs/{id}').onCreate(async (snap, context) => {
  const data = snap.data()
  functions.logger.info('Admin action logged', data)
})

export async function writeAuditLog(actor_uid: string, action: string, details: any) {
  await admin.firestore().collection('audit_logs').add({
    actor_uid,
    action,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    details
  })
}
