// app/api/user/delete-account/route.ts
import { NextResponse } from 'next/server'
import { getAdminDb, getAdminAuth } from '../../../../lib/firebaseAdmin'

export async function DELETE(req: Request) {
  try {
    const { uid } = await req.json()
    
    if (!uid) {
      return NextResponse.json({ ok: false, error: 'Missing uid' }, { status: 400 })
    }

    const auth = getAdminAuth()
    const db = getAdminDb()
    
    if (!auth || !db) {
      return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
    }

    // Delete user data from Firestore
    const collections = [
      'favorites',
      'inquiries',
      'saved_searches',
      'analytics_events',
      'notifications',
      'user_activity',
      'messages'
    ]

    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).where('userId', '==', uid).get()
      const batch = db.batch()
      snapshot.docs.forEach((doc: any) => batch.delete(doc.ref))
      await batch.commit()
    }

    // Delete user document
    const userDoc = db.collection('users').doc(uid)
    await userDoc.delete()

    // Delete from Firebase Auth
    await auth.deleteUser(uid)

    console.log(`Account deleted for user ${uid}`)

    return NextResponse.json({
      ok: true,
      message: 'Account successfully deleted'
    })
  } catch (error: any) {
    console.error('Error deleting account:', error)
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to delete account'
    }, { status: 500 })
  }
}
