import * as admin from 'firebase-admin'

if (!process.env.MASTER_ADMIN_EMAIL) {
  // eslint-disable-next-line no-console
  console.error('Set MASTER_ADMIN_EMAIL env var to the email you want to promote')
  process.exit(1)
}

admin.initializeApp()

async function main() {
  const email = process.env.MASTER_ADMIN_EMAIL as string
  const auth = admin.auth()
  let user
  try {
    user = await auth.getUserByEmail(email)
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('User not found for email:', email)
    process.exit(1)
  }
  const db = admin.firestore()
  await db.collection('users').doc(user.uid).set({
    email,
    role: 'master_admin',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true })
  // eslint-disable-next-line no-console
  console.log('Promoted to master_admin:', email, 'uid:', user.uid)
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
