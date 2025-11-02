import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { v4 as uuidv4 } from 'uuid'
import { writeAuditLog } from './auditLog'

// Accept Invite Cloud Function
export const acceptInvite = functions.https.onCall(async (data, context) => {
  const { token, uid, email } = data
  if (!token || !uid || !email) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields')
  }
  const inviteRef = admin.firestore().collection('invites').where('token', '==', token).limit(1)
  const inviteSnap = await inviteRef.get()
  if (inviteSnap.empty) {
    throw new functions.https.HttpsError('not-found', 'Invite not found')
  }
  const invite = inviteSnap.docs[0].data()
  if (invite.used) {
    throw new functions.https.HttpsError('failed-precondition', 'Invite already used')
  }
  if (invite.email !== email) {
    throw new functions.https.HttpsError('permission-denied', 'Email does not match invite')
  }
  const now = admin.firestore.Timestamp.now()
  if (invite.expiresAt && invite.expiresAt.toMillis() < now.toMillis()) {
    throw new functions.https.HttpsError('deadline-exceeded', 'Invite expired')
  }
  // Set user document
  await admin.firestore().collection('users').doc(uid).set({
    displayName: '',
    email,
    role: invite.role,
    brokerage_id: invite.brokerage_id || null,
    status: 'pending',
    createdAt: now,
    trustedScore: 0.5,
    lastAuthCodeSentAt: null
  }, { merge: true })
  // Mark invite as used
  await inviteSnap.docs[0].ref.update({ used: true })
  // Write audit log
  await writeAuditLog(uid, 'accept_invite', { token, email, role: invite.role })
  return { status: 'pending' }
})
