import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

async function nextSequentialId(kind: 'broker'|'agent') {
  const countersRef = admin.firestore().collection('counters').doc(kind)
  const res = await admin.firestore().runTransaction(async (tx) => {
    const snap = await tx.get(countersRef)
    const current = snap.exists ? (snap.get('value') as number) : 0
    const next = current + 1
    tx.set(countersRef, { value: next }, { merge: true })
    return next
  })
  if (kind === 'broker') return `B${String(res).padStart(4,'0')}`
  return `A${String(res).padStart(6,'0')}`
}

export const processApplication = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Auth required')
  const userDoc = await admin.firestore().collection('users').doc(uid).get()
  const role = userDoc.get('role')
  if (!['broker_admin','master_admin'].includes(role)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only')
  }

  const { appId, action } = data as { appId: string, action: 'approve'|'reject'|'more_info' }
  if (!appId || !action) throw new functions.https.HttpsError('invalid-argument', 'Missing fields')
  const appRef = admin.firestore().collection('applications').doc(appId)
  const appSnap = await appRef.get()
  if (!appSnap.exists) throw new functions.https.HttpsError('not-found', 'Application not found')
  const app = appSnap.data() as any

  if (action === 'reject' || action === 'more_info') {
    await appRef.update({ status: action })
    await admin.firestore().collection('audit_logs').add({
      actor: uid, action: `application_${action}`, target: appId, ts: admin.firestore.FieldValue.serverTimestamp(), payload: { email: app.email }
    })
    return { ok: true }
  }

  // Approve flow
  const ts = admin.firestore.FieldValue.serverTimestamp()
  if (app.type === 'broker') {
    // Create brokerage and assign sequential broker ID
    const brokerId = await nextSequentialId('broker')
    const brokerageRef = admin.firestore().collection('brokerages').doc(brokerId)
    await brokerageRef.set({
      id: brokerId,
      name: app.company || app.contact,
      createdAt: ts,
      status: 'active',
      markets: app.markets || '',
    })
    // Create invite for brokerage admin
    const token = Math.random().toString(36).slice(2, 10)
    await admin.firestore().collection('invites').add({
      email: app.email,
      role: 'broker_admin',
      brokerage_id: brokerId,
      token,
      used: false,
      createdAt: ts,
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 7*24*60*60*1000)
    })
    await appRef.update({ status: 'approved', brokerage_id: brokerId, approvedAt: ts })
    await admin.firestore().collection('audit_logs').add({ actor: uid, action: 'application_approved', target: appId, ts, payload: { brokerId, email: app.email } })
    return { ok: true, brokerId }
  }

  if (app.type === 'agent') {
    const agentId = await nextSequentialId('agent')
    // For an individual agent application we still need a brokerage; if none, create a personal brokerage record
    const brokerageId = app.brokerage_id || `BR-${agentId}`
    if (!app.brokerage_id) {
      await admin.firestore().collection('brokerages').doc(brokerageId).set({ id: brokerageId, name: app.company || app.contact, createdAt: ts, status: 'active' })
    }
    const token = Math.random().toString(36).slice(2, 10)
    await admin.firestore().collection('invites').add({
      email: app.email,
      role: 'agent',
      brokerage_id: brokerageId,
      token,
      used: false,
      createdAt: ts,
      expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + 7*24*60*60*1000)
    })
    await appRef.update({ status: 'approved', agent_id: agentId, brokerage_id: brokerageId, approvedAt: ts })
    await admin.firestore().collection('audit_logs').add({ actor: uid, action: 'application_approved', target: appId, ts, payload: { agentId, brokerageId, email: app.email } })
    return { ok: true, agentId }
  }

  if (app.type === 'developer') {
    // For developers, approve and create a partner record; invites can be manual
    const devRef = admin.firestore().collection('developers').doc()
    await devRef.set({ name: app.company || app.contact, email: app.email, createdAt: ts, status: 'active' })
    await appRef.update({ status: 'approved', developer_id: devRef.id, approvedAt: ts })
    await admin.firestore().collection('audit_logs').add({ actor: uid, action: 'application_approved', target: appId, ts, payload: { developerId: devRef.id, email: app.email } })
    return { ok: true, developerId: devRef.id }
  }

  throw new functions.https.HttpsError('invalid-argument', 'Unknown application type')
})
