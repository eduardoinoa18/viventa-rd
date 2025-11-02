import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as crypto from 'crypto'

const CODE_LENGTH = 6
const CODE_EXPIRY_MINUTES = 10
const MAX_CODES_PER_HOUR = 3

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export const sendAdminCode = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Auth required')
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const role = userDoc.get('role')
  if (!['admin','master_admin'].includes(role)) throw new functions.https.HttpsError('permission-denied', 'Admin only')

  // Rate limit: max 3 codes/hour
  const codesSnap = await admin.firestore().collection('auth_codes').where('uid','==',uid).where('createdAt','>', admin.firestore.Timestamp.fromMillis(Date.now()-3600*1000)).get()
  if (codesSnap.size >= MAX_CODES_PER_HOUR) throw new functions.https.HttpsError('resource-exhausted', 'Too many codes requested')

  // Generate code
  const code = (Math.floor(100000 + Math.random() * 900000)).toString()
  const hash = hashCode(code)
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + CODE_EXPIRY_MINUTES*60*1000)
  await admin.firestore().collection('auth_codes').add({ uid, hash, expiresAt, createdAt: admin.firestore.FieldValue.serverTimestamp() })

  // TODO: Send code via SendGrid (email) and optionally WhatsApp
  // await sendEmail(userDoc.get('email'), code)

  // Log attempt
  await admin.firestore().collection('auth_attempts').add({ uid, action: 'send_code', ts: admin.firestore.FieldValue.serverTimestamp() })

  return { ok: true }
})

export const verifyAdminCode = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid
  const code = data.code
  if (!uid || !code) throw new functions.https.HttpsError('invalid-argument', 'Missing uid or code')
  const hash = hashCode(code)
  const codesSnap = await admin.firestore().collection('auth_codes').where('uid','==',uid).where('hash','==',hash).where('expiresAt','>', admin.firestore.Timestamp.now()).get()
  if (codesSnap.empty) {
    await admin.firestore().collection('auth_attempts').add({ uid, action: 'verify_code_failed', ts: admin.firestore.FieldValue.serverTimestamp() })
    throw new functions.https.HttpsError('permission-denied', 'Invalid or expired code')
  }
  // Success: update lastVerifiedAt, set custom claim
  await admin.firestore().collection('users').doc(uid).update({ lastVerifiedAt: admin.firestore.FieldValue.serverTimestamp() })
  // Set custom claim (admin_verified_until = now + 30 days)
  const admin_verified_until = Date.now() + 30*24*60*60*1000
  await admin.auth().setCustomUserClaims(uid, { admin_verified_until })
  await admin.firestore().collection('auth_attempts').add({ uid, action: 'verify_code_success', ts: admin.firestore.FieldValue.serverTimestamp() })
  return { ok: true, admin_verified_until }
})
