// app/api/admin/properties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { sendEmail } from '@/lib/emailService'
import { ActivityLogger } from '@/lib/activityLogger'

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
      // Activity log
      try {
        await ActivityLogger.log({
          type: 'property',
            action: 'Property Created',
            userId: agentId,
            userName: agentName,
            metadata: { propertyId: ref.id, title, price: propertyDoc.price, listingType, propertyType }
        })
      } catch (e) { console.debug('activity log failed (create property)', e) }
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
      // Fetch property to get agent info
      const ref = adminDb.collection('properties').doc(id)
      const snap = await ref.get()
      const before = snap.exists ? snap.data() : null
      await ref.update(updates)
      try {
        await ActivityLogger.log({
          type: 'property',
          action: 'Property Updated',
          userId: (before as any)?.agentId,
          userName: (before as any)?.agentName,
          metadata: { propertyId: id, updates }
        })
      } catch (e) { console.debug('activity log failed (update property)', e) }

      // If approved, email agent
      try {
        if (status === 'active' && before) {
          const agentEmail = (before as any).agentEmail
          const agentName = (before as any).agentName
          const listingTitle = (before as any).title
          if (agentEmail && listingTitle) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://viventa-rd.com'
            const url = `${baseUrl}/listing/${id}`
            const from = process.env.NEXT_PUBLIC_EMAIL_FROM || 'no-reply@viventa-rd.com'
            const subject = `Tu listado ya está publicado: ${listingTitle}`
            const html = `
              <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0B2545">
                <div style="padding:24px;border-radius:12px;background:linear-gradient(135deg,#00A676,#00A6A6);color:#fff">
                  <h1 style=\"margin:0;font-size:22px\">¡Tu propiedad está en vivo!</h1>
                  <p style=\"margin:6px 0 0;opacity:.9\">Ya es visible en VIVENTA para todos los usuarios.</p>
                </div>
                <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin-top:-12px;position:relative">
                  <h2 style="margin:0 0 12px">${listingTitle}</h2>
                  <p>Hola ${agentName || ''},</p>
                  <p>Acabamos de publicar tu propiedad. Puedes verla aquí:</p>
                  <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#00A676;color:#fff;border-radius:8px;text-decoration:none">Ver listado</a></p>
                </div>
              </div>
            `
            await sendEmail({ to: agentEmail, from, subject, html, replyTo: from })
          }
        }
      } catch (e) {
        console.error('Failed to send approval email:', e)
      }

      return NextResponse.json({ ok: true, message: 'Property updated successfully' })
    }

    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const updates: any = { updatedAt: serverTimestamp() }
    if (status) updates.status = status // pending, active, rejected, sold, draft
    if (typeof featured === 'boolean') updates.featured = featured

    // Fetch property before update to get email info
    let before: any = null
    try {
      const prevSnap = await getDoc(doc(db, 'properties', id))
      before = prevSnap.exists() ? prevSnap.data() : null
    } catch {}

  await updateDoc(doc(db, 'properties', id), updates)

    // If approved, email agent
    try {
      if (status === 'active' && before) {
        const agentEmail = (before as any).agentEmail
        const agentName = (before as any).agentName
        const listingTitle = (before as any).title
        if (agentEmail && listingTitle) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://viventa-rd.com'
          const url = `${baseUrl}/listing/${id}`
          const from = process.env.NEXT_PUBLIC_EMAIL_FROM || 'no-reply@viventa-rd.com'
          const subject = `Tu listado ya está publicado: ${listingTitle}`
          const html = `
            <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#0B2545">
              <div style="padding:24px;border-radius:12px;background:linear-gradient(135deg,#00A676,#00A6A6);color:#fff">
                <h1 style=\"margin:0;font-size:22px\">¡Tu propiedad está en vivo!</h1>
                <p style=\"margin:6px 0 0;opacity:.9\">Ya es visible en VIVENTA para todos los usuarios.</p>
              </div>
              <div style="padding:24px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;margin-top:-12px;position:relative">
                <h2 style="margin:0 0 12px">${listingTitle}</h2>
                <p>Hola ${agentName || ''},</p>
                <p>Acabamos de publicar tu propiedad. Puedes verla aquí:</p>
                <p><a href="${url}" style="display:inline-block;padding:10px 16px;background:#00A676;color:#fff;border-radius:8px;text-decoration:none">Ver listado</a></p>
              </div>
            </div>
          `
          await sendEmail({ to: agentEmail, from, subject, html, replyTo: from })
        }
      }
    } catch (e) {
      console.error('Failed to send approval email:', e)
    }

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
      try {
        await ActivityLogger.log({
          type: 'property',
          action: 'Property Deleted',
          metadata: { propertyId: id }
        })
      } catch (e) { console.debug('activity log failed (delete property)', e) }
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
