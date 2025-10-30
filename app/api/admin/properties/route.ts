// app/api/admin/properties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'

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

// GET /api/admin/properties - list all properties with optional status filter
export async function GET(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    if (adminDb) {
      const { searchParams } = new URL(req.url)
      const statusFilter = searchParams.get('status')
      // Use a loosely-typed reference to avoid CollectionReference/Query assignability issues
      let ref: any = adminDb.collection('properties')
      if (statusFilter) ref = ref.where('status', '==', statusFilter)
      const snap = await ref.orderBy('createdAt', 'desc').get()
      const properties = snap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
      return NextResponse.json({ ok: true, data: properties })
    }

    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') // active, pending, rejected, sold, draft

    let q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'))
    if (statusFilter) {
      q = query(collection(db, 'properties'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
    }

    const snapshot = await getDocs(q)
    const properties = snapshot.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
    }))

    return NextResponse.json({ ok: true, data: properties })
  } catch (e: any) {
    console.error('admin properties GET error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch properties' }, { status: 500 })
  }
}

// POST /api/admin/properties - create new property listing
export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb()
    const body = await req.json()
    const { title, description, price, location, lat, lng, bedrooms, bathrooms, area, propertyType, listingType, images, agentId, agentName } = body

    if (!title || !price || !location || !propertyType || !listingType || !agentId) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (adminDb) {
      const propertyDoc = {
        title,
        description: description || '',
        price: parseFloat(price),
        location,
        lat: lat || null,
        lng: lng || null,
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseFloat(bathrooms) || 0,
        area: parseFloat(area) || 0,
        propertyType,
        listingType,
        images: images || [],
        agentId,
        agentName: agentName || '',
        status: 'pending',
        featured: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      const ref = await adminDb.collection('properties').add(propertyDoc)
      return NextResponse.json({ ok: true, data: { id: ref.id, ...propertyDoc }, message: 'Property created successfully' })
    }

    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const propertyDoc = {
      title,
      description: description || '',
      price: parseFloat(price),
      location,
      lat: lat || null,
      lng: lng || null,
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseFloat(bathrooms) || 0,
      area: parseFloat(area) || 0,
      propertyType, // apartment, house, condo, land, commercial
      listingType, // sale, rent
      images: images || [],
      agentId,
      agentName: agentName || '',
      status: 'pending', // pending, active, rejected, sold, draft
      featured: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    const docRef = await addDoc(collection(db, 'properties'), propertyDoc)

    return NextResponse.json({
      ok: true,
      data: { id: docRef.id, ...propertyDoc },
      message: 'Property created successfully',
    })
  } catch (e: any) {
    console.error('admin properties POST error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to create property' }, { status: 500 })
  }
}

// PATCH /api/admin/properties - update property status or details
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, status, featured } = body
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (adminDb) {
      const updates: any = { updatedAt: new Date() }
      if (status) updates.status = status
      if (typeof featured === 'boolean') updates.featured = featured
      await adminDb.collection('properties').doc(id).update(updates)
      return NextResponse.json({ ok: true, message: 'Property updated successfully' })
    }

    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const updates: any = { updatedAt: serverTimestamp() }
    if (status) updates.status = status // pending, active, rejected, sold, draft
    if (typeof featured === 'boolean') updates.featured = featured

    await updateDoc(doc(db, 'properties', id), updates)

    return NextResponse.json({
      ok: true,
      message: 'Property updated successfully',
    })
  } catch (e: any) {
    console.error('admin properties PATCH error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to update property' }, { status: 500 })
  }
}

// DELETE /api/admin/properties - delete a property
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { id } = body
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
    }

    const adminDb = getAdminDb()
    if (adminDb) {
      await adminDb.collection('properties').doc(id).delete()
      return NextResponse.json({ ok: true, message: 'Property deleted successfully' })
    }

    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(db, 'properties', id))

    return NextResponse.json({
      ok: true,
      message: 'Property deleted successfully',
    })
  } catch (e: any) {
    console.error('admin properties DELETE error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to delete property' }, { status: 500 })
  }
}
