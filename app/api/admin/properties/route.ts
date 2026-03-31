// app/api/admin/properties/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { requireMasterAdmin } from '@/lib/adminApiAuth'
import { sendEmail } from '@/lib/emailService'
import { ActivityLogger } from '@/lib/activityLogger'
import { getPublicAppUrl } from '@/lib/publicAppUrl'

export const dynamic = 'force-dynamic'

type PropertyUnit = {
  unitNumber: string
  modelType: string
  sizeMt2: number
  price: number
  status: 'available' | 'reserved' | 'sold'
}

type TerrainDetails = {
  zoningType?: string
  maxBuildHeight?: string
  buildPotential?: string
  utilitiesAvailable?: string[]
}

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

function computeListingIntelligence(source: any) {
  const images = Array.isArray(source?.images) ? source.images : []
  const title = String(source?.title || '').trim()
  const description = String(source?.description || source?.publicRemarks || '').trim()
  const city = String(source?.city || source?.location || '').trim()
  const sector = String(source?.sector || source?.neighborhood || '').trim()
  const price = Number(source?.price || 0)
  const area = Number(source?.area || source?.squareMeters || 0)
  const bedrooms = Number(source?.bedrooms || 0)
  const bathrooms = Number(source?.bathrooms || 0)
  const hasGeocode = Number.isFinite(Number(source?.lat)) && Number.isFinite(Number(source?.lng)) && Number(source?.lat) !== 0 && Number(source?.lng) !== 0
  const hasAssignedBroker = Boolean(String(source?.brokerName || source?.companyName || '').trim())

  const checks = [
    title.length > 3,
    description.length > 20,
    price > 0,
    city.length > 0,
    sector.length > 0,
    area > 0,
    images.length > 0,
    bedrooms >= 0,
    bathrooms >= 0,
    hasGeocode,
  ]

  const qualityScore = Math.round((checks.filter(Boolean).length / checks.length) * 100)

  const visibilityScore = Math.round(
    Math.min(
      100,
      (images.length > 0 ? 30 : 0) +
      (title ? 20 : 0) +
      (description ? 20 : 0) +
      (city ? 15 : 0) +
      (sector ? 15 : 0)
    )
  )

  const seoScore = Math.round(
    Math.min(
      100,
      (title.length >= 20 ? 40 : title.length > 0 ? 25 : 0) +
      (description.length >= 80 ? 40 : description.length > 20 ? 25 : 0) +
      (city && sector ? 20 : city ? 10 : 0)
    )
  )

  const anomalyFlags: string[] = []
  if (images.length === 0) anomalyFlags.push('missing_photos')
  if (!hasGeocode) anomalyFlags.push('missing_geocode')
  if (!hasAssignedBroker) anomalyFlags.push('no_assigned_broker')
  if (price > 0 && area > 0) {
    const pricePerM2 = price / area
    if (pricePerM2 < 150 || pricePerM2 > 15000) anomalyFlags.push('price_anomaly')
  }
  if (qualityScore < 60) anomalyFlags.push('low_quality')

  return {
    qualityScore,
    visibilityScore,
    seoScore,
    anomalyFlags,
    missingPhotos: images.length === 0,
    missingGeocode: !hasGeocode,
    hasAssignedBroker,
  }
}

function markDuplicateRisk(rows: any[]) {
  const keyMap = new Map<string, number>()

  for (const row of rows) {
    const key = `${String(row?.title || '').trim().toLowerCase()}|${String(row?.city || row?.location || '').trim().toLowerCase()}|${Number(row?.price || 0)}`
    keyMap.set(key, (keyMap.get(key) || 0) + 1)
  }

  return rows.map((row) => {
    const key = `${String(row?.title || '').trim().toLowerCase()}|${String(row?.city || row?.location || '').trim().toLowerCase()}|${Number(row?.price || 0)}`
    return {
      ...row,
      duplicateRisk: (keyMap.get(key) || 0) > 1 && key !== '||0',
    }
  })
}

// GET /api/admin/properties - list all properties with optional status filter
export async function GET(req: NextRequest) {
  try {
    const authError = await requireMasterAdmin(req)
    if (authError) return authError

    const adminDb = getAdminDb()
    if (adminDb) {
      const { searchParams } = new URL(req.url)
      const statusFilter = searchParams.get('status')
      // Use a loosely-typed reference to avoid CollectionReference/Query assignability issues
      let ref: any = adminDb.collection('properties')
      if (statusFilter) ref = ref.where('status', '==', statusFilter)
      let snap: any
      try {
        snap = await ref.orderBy('createdAt', 'desc').get()
      } catch (error: any) {
        const message = String(error?.message || '').toLowerCase()
        const missingIndex = message.includes('requires an index') || message.includes('failed-precondition')
        if (!missingIndex) throw error

        const fallbackSnap = await ref.get()
        const sorted = [...fallbackSnap.docs].sort((a: any, b: any) => {
          const aRaw = a.data() as any
          const bRaw = b.data() as any
          const aTime = aRaw?.createdAt?.toDate?.()?.getTime?.() || new Date(aRaw?.createdAt || 0).getTime() || 0
          const bTime = bRaw?.createdAt?.toDate?.()?.getTime?.() || new Date(bRaw?.createdAt || 0).getTime() || 0
          return bTime - aTime
        })
        snap = { docs: sorted }
      }
      const withSignals = snap.docs.map((d: any) => {
        const raw = d.data()
        return {
          id: d.id,
          ...raw,
          ...computeListingIntelligence(raw),
        }
      })
      const properties = markDuplicateRisk(withSignals)
      return NextResponse.json({ ok: true, data: properties })
    }

    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Firebase not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') // active, pending, rejected, sold, draft

    let snapshot: any
    try {
      let q = query(collection(db, 'properties'), orderBy('createdAt', 'desc'))
      if (statusFilter) {
        q = query(collection(db, 'properties'), where('status', '==', statusFilter), orderBy('createdAt', 'desc'))
      }
      snapshot = await getDocs(q)
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase()
      const missingIndex = message.includes('requires an index') || message.includes('failed-precondition')
      if (!missingIndex) throw error

      const fallbackQuery = statusFilter
        ? query(collection(db, 'properties'), where('status', '==', statusFilter))
        : query(collection(db, 'properties'))
      const fallbackSnap = await getDocs(fallbackQuery)
      const sorted = [...fallbackSnap.docs].sort((a: any, b: any) => {
        const aRaw = a.data() as any
        const bRaw = b.data() as any
        const aTime = aRaw?.createdAt?.toDate?.()?.getTime?.() || new Date(aRaw?.createdAt || 0).getTime() || 0
        const bTime = bRaw?.createdAt?.toDate?.()?.getTime?.() || new Date(bRaw?.createdAt || 0).getTime() || 0
        return bTime - aTime
      })
      snapshot = { docs: sorted }
    }
    const withSignals = snapshot.docs.map((d: any) => {
      const raw = d.data()
      return {
        id: d.id,
        ...raw,
        ...computeListingIntelligence(raw),
      }
    })
    const properties = markDuplicateRisk(withSignals)

    return NextResponse.json({ ok: true, data: properties })
  } catch (e: any) {
    console.error('admin properties GET error', e)
    return NextResponse.json({ ok: false, error: e.message || 'Failed to fetch properties' }, { status: 500 })
  }
}

// POST /api/admin/properties - create new property listing
export async function POST(req: NextRequest) {
  try {
    const authError = await requireMasterAdmin(req)
    if (authError) return authError

    const adminDb = getAdminDb()
    const body = await req.json()
    const {
      title,
      description,
      price,
      location,
      lat,
      lng,
      bedrooms,
      bathrooms,
      area,
      propertyType,
      listingType,
      images,
      coverImage,
      promoVideoUrl,
      maintenanceFee,
      maintenanceFeeCurrency,
      maintenanceInfo,
      inventoryMode,
      totalUnits,
      availableUnits,
      soldUnits,
      projectMapImage,
      projectMapHotspots,
      units,
      terrainDetails,
      features,
      publicRemarks,
      professionalRemarks,
      currency,
      city,
      neighborhood,
      status,
      featured,
      agentId,
      agentName,
      agentEmail,
      representation,
      brokerName,
      builderName,
      companyName,
      developerId,
    } = body

    if (!title || !price || !location || !propertyType || !listingType || !agentId) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
    }

    if (adminDb) {
      const totalUnitsNum = totalUnits ? Number(totalUnits) : 1
      const availableUnitsNum = availableUnits ? Number(availableUnits) : 1
      const inventoryModeValue = inventoryMode || 'single'
      const computedSoldUnits = inventoryModeValue === 'project'
        ? Math.max(totalUnitsNum - availableUnitsNum, 0)
        : Number(soldUnits || 0)

      let ownerRole = ''
      let professionalCode = ''
      let agentCode = ''
      let brokerCode = ''
      let constructoraCode = ''

      if (agentId) {
        const ownerSnap = await adminDb.collection('users').doc(String(agentId)).get()
        if (ownerSnap.exists) {
          const owner = ownerSnap.data() as any
          ownerRole = String(owner?.role || '')
          professionalCode = String(owner?.professionalCode || owner?.agentCode || owner?.brokerCode || owner?.constructoraCode || '')
          agentCode = String(owner?.agentCode || '')
          brokerCode = String(owner?.brokerCode || '')
          constructoraCode = String(owner?.constructoraCode || '')
        }
      }

      const propertyDoc = {
        title,
        description: description || '',
        publicRemarks: publicRemarks || '',
        professionalRemarks: professionalRemarks || '',
        price: parseFloat(price),
        currency: currency || 'USD',
        location,
        city: city || '',
        neighborhood: neighborhood || '',
        lat: lat || null,
        lng: lng || null,
        bedrooms: parseInt(bedrooms) || 0,
        bathrooms: parseFloat(bathrooms) || 0,
        area: parseFloat(area) || 0,
        propertyType,
        listingType,
        images: images || [],
        coverImage: coverImage || (Array.isArray(images) && images.length > 0 ? images[0] : ''),
        promoVideoUrl: promoVideoUrl || '',
        maintenanceFee: maintenanceFee ? Number(maintenanceFee) : 0,
        maintenanceFeeCurrency: maintenanceFeeCurrency || 'USD',
        maintenanceInfo: maintenanceInfo || '',
        inventoryMode: inventoryModeValue,
        totalUnits: totalUnitsNum,
        availableUnits: availableUnitsNum,
        soldUnits: computedSoldUnits,
        projectMapImage: projectMapImage || '',
        projectMapHotspots: Array.isArray(projectMapHotspots) ? projectMapHotspots : [],
        units: Array.isArray(units) ? units as PropertyUnit[] : [],
        terrainDetails: terrainDetails && typeof terrainDetails === 'object' ? terrainDetails as TerrainDetails : undefined,
        features: Array.isArray(features) ? features : [],
        agentId,
        agentName: agentName || '',
        agentEmail: agentEmail || '',
        ownerRole,
        professionalCode,
        agentCode,
        brokerCode,
        constructoraCode,
        representation: representation || '',
        brokerName: brokerName || '',
        builderName: builderName || '',
        companyName: companyName || '',
        developerId: developerId || undefined,
        status: status || 'pending',
        featured: Boolean(featured),
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

    const totalUnitsNum = totalUnits ? Number(totalUnits) : 1
    const availableUnitsNum = availableUnits ? Number(availableUnits) : 1
    const inventoryModeValue = inventoryMode || 'single'
    const computedSoldUnits = inventoryModeValue === 'project'
      ? Math.max(totalUnitsNum - availableUnitsNum, 0)
      : Number(soldUnits || 0)

    const propertyDoc = {
      title,
      description: description || '',
      publicRemarks: publicRemarks || '',
      professionalRemarks: professionalRemarks || '',
      price: parseFloat(price),
      currency: currency || 'USD',
      location,
      city: city || '',
      neighborhood: neighborhood || '',
      lat: lat || null,
      lng: lng || null,
      bedrooms: parseInt(bedrooms) || 0,
      bathrooms: parseFloat(bathrooms) || 0,
      area: parseFloat(area) || 0,
      propertyType, // apartment, house, condo, land, commercial
      listingType, // sale, rent
      images: images || [],
      coverImage: coverImage || (Array.isArray(images) && images.length > 0 ? images[0] : ''),
      promoVideoUrl: promoVideoUrl || '',
      maintenanceFee: maintenanceFee ? Number(maintenanceFee) : 0,
      maintenanceFeeCurrency: maintenanceFeeCurrency || 'USD',
      maintenanceInfo: maintenanceInfo || '',
      inventoryMode: inventoryModeValue,
      totalUnits: totalUnitsNum,
      availableUnits: availableUnitsNum,
      soldUnits: computedSoldUnits,
      projectMapImage: projectMapImage || '',
      projectMapHotspots: Array.isArray(projectMapHotspots) ? projectMapHotspots : [],
      units: Array.isArray(units) ? units as PropertyUnit[] : [],
      terrainDetails: terrainDetails && typeof terrainDetails === 'object' ? terrainDetails as TerrainDetails : undefined,
      features: Array.isArray(features) ? features : [],
      agentId,
      agentName: agentName || '',
      agentEmail: agentEmail || '',
      representation: representation || '',
      brokerName: brokerName || '',
      builderName: builderName || '',
      companyName: companyName || '',
      developerId: developerId || undefined,
      status: status || 'pending', // pending, active, rejected, sold, draft
      featured: Boolean(featured),
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
    const authError = await requireMasterAdmin(req)
    if (authError) return authError

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
            const baseUrl = getPublicAppUrl()
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
          const baseUrl = getPublicAppUrl()
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
    const authError = await requireMasterAdmin(req)
    if (authError) return authError

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
