// app/api/admin/diagnostics/route.ts
import { NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore'

function initFirebase() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  const valid = Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.storageBucket &&
    config.messagingSenderId &&
    config.appId
  )
  if (!valid) return null
  if (!getApps().length) initializeApp(config as any)
  return getFirestore()
}

export async function GET() {
  try {
    const firebase = {
      apiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    }

    const algolia = {
      appId: !!process.env.NEXT_PUBLIC_ALGOLIA_APP_ID,
      searchKey: !!process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY,
      index: !!process.env.NEXT_PUBLIC_ALGOLIA_INDEX,
    }

    const email = {
      sendgrid: !!process.env.SENDGRID_API_KEY,
      smtp: !!process.env.SMTP_HOST && !!process.env.SMTP_USER && !!process.env.SMTP_PASS,
      from: !!(process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM),
    }

    const mapbox = {
      token: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    }

    const adminAuth = {
      allowAny: process.env.ALLOW_ANY_MASTER_EMAIL === 'true',
      allowDevResponse: process.env.ALLOW_DEV_2FA_RESPONSE === 'true',
      allowlistConfigured: !!(process.env.MASTER_ADMIN_EMAILS || process.env.MASTER_ADMIN_EMAIL),
    }

    // Check Firestore collections with actual data
    const db = initFirebase()
    const firestoreData: any = {}
    
    if (db) {
      const collections_to_check = ['users', 'properties', 'leads', 'applications', 'messages', 'contact_submissions']
      
      for (const collectionName of collections_to_check) {
        try {
          const q = query(collection(db, collectionName), limit(3))
          const snapshot = await getDocs(q)
          firestoreData[collectionName] = {
            exists: true,
            count: snapshot.size,
            sampleIds: snapshot.docs.map((d: any) => d.id),
            sampleData: snapshot.docs.map((d: any) => {
              const data = d.data()
              // Return only non-sensitive fields for diagnostics
              return {
                id: d.id,
                createdAt: data.createdAt ? 'present' : 'missing',
                status: data.status || 'N/A',
                role: data.role || 'N/A',
                email: data.email ? `${data.email.substring(0, 3)}***` : 'N/A'
              }
            })
          }
        } catch (e: any) {
          firestoreData[collectionName] = {
            exists: false,
            error: e.message
          }
        }
      }
    } else {
      firestoreData.error = 'Firebase not initialized'
    }

    return NextResponse.json({ 
      ok: true, 
      data: { 
        firebase, 
        algolia, 
        email, 
        mapbox, 
        adminAuth,
        firestoreData,
        timestamp: new Date().toISOString()
      } 
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Diagnostics error' }, { status: 500 })
  }
}
