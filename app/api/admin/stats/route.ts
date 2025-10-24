// app/api/admin/stats/route.ts
import { NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getCountFromServer, query, where } from 'firebase/firestore'

export async function GET() {
  try {
    // Initialize Firebase for server-side if needed
    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }
    const valid = Boolean(
      firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.storageBucket &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId
    )

    if (!valid) {
      return NextResponse.json({
        ok: true,
        data: {
          totalUsers: 0,
          activeListings: 0,
          pendingApprovals: 0,
          leads: 0,
          monthlyRevenueUSD: 0,
        },
        note: 'Firebase not configured on server; returning zeros',
      })
    }

    if (!getApps().length) {
      initializeApp(firebaseConfig as any)
    }
    const db = getFirestore()
    // Count users
    const usersColl = collection(db, 'users')
    const usersSnap = await getCountFromServer(usersColl)

    // Count active listings
    const propsActiveQ = query(collection(db, 'properties'), where('status', '==', 'active'))
    const propsActiveSnap = await getCountFromServer(propsActiveQ)

    // Count pending approvals (properties pending)
    const propsPendingQ = query(collection(db, 'properties'), where('status', '==', 'pending'))
    const propsPendingSnap = await getCountFromServer(propsPendingQ)

    // Leads count
    const leadsColl = collection(db, 'leads')
    const leadsSnap = await getCountFromServer(leadsColl)

    // Monthly revenue placeholder (integrate Stripe later)
    const monthlyRevenueUSD = 0

    return NextResponse.json({
      ok: true,
      data: {
        totalUsers: usersSnap.data().count || 0,
        activeListings: propsActiveSnap.data().count || 0,
        pendingApprovals: propsPendingSnap.data().count || 0,
        leads: leadsSnap.data().count || 0,
        monthlyRevenueUSD,
      },
    })
  } catch (e) {
    console.error('admin stats error', e)
    return NextResponse.json({ ok: false, error: 'Failed to load stats' }, { status: 500 })
  }
}
