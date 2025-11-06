import { NextResponse } from "next/server"
import { cookies } from 'next/headers'
import { ActivityLogger } from "@/lib/activityLogger"
import { getAdminDb } from "@/lib/firebaseAdmin"
import { FieldValue } from 'firebase-admin/firestore'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agentId = searchParams.get('agentId')
    const db = getAdminDb()
    if (!db) {
      console.error('Admin DB not available')
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    let q = db.collection('properties').orderBy('createdAt', 'desc')
    if (agentId) {
      q = db.collection('properties').where('agentId', '==', agentId).orderBy('createdAt', 'desc')
    } else {
      // default to active properties for public listing
      q = db.collection('properties').where('status', '==', 'active').orderBy('createdAt', 'desc')
    }
    const snap = await q.limit(100).get()
    const properties = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    return NextResponse.json({ properties })
  } catch (error: any) {
    console.error('Error fetching properties:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch properties' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, ...data } = body
    const db = getAdminDb()
    if (!db) {
      console.error('Admin DB not available')
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    // Basic role-based authorization
    const role = cookies().get('viventa_role')?.value
    const uid = cookies().get('viventa_uid')?.value
    const isAdmin = role === 'admin' || role === 'master_admin'
    const isPro = role === 'agent' || role === 'broker'

    if (action === 'create') {
      if (!(isAdmin || isPro)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      // Ensure agentId defaults to caller uid for pros
      const createData = { ...data }
      if (isPro && uid && !createData.agentId) {
        createData.agentId = uid
      }
      // Generate listingId via yearly counter in a transaction
      const { listingId, id } = await db.runTransaction(async (tx) => {
        const year = new Date().getFullYear().toString()
        const countersRef = db.collection('counters').doc('listings')
        const countersSnap = await tx.get(countersRef)
        const counters = countersSnap.exists ? (countersSnap.data() || {}) as Record<string, number> : {}
        const current = Number(counters[year] || 0)
        const next = current + 1
        const nextCounters = { ...counters, [year]: next }
        if (countersSnap.exists) tx.update(countersRef, nextCounters)
        else tx.set(countersRef, nextCounters)

        const generatedId = `VIV-${year}-${String(next).padStart(6, '0')}`
        const propRef = db.collection('properties').doc()
        tx.set(propRef, {
          ...createData,
          listingId: generatedId,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        })
        return { listingId: generatedId, id: propRef.id }
      })
      
      // Log property creation
      await ActivityLogger.log({
        type: 'property',
        action: 'Property Created',
        userId: data.agentId || 'unknown',
        userName: data.agentName,
        userEmail: data.agentEmail,
        metadata: {
          propertyId: id,
          title: data.title || data.name,
          type: data.type || data.propertyType,
          price: data.price,
          listingId,
        }
      })
      
      return NextResponse.json({ success: true, message: "Property created", id, listingId })
    } else if (action === 'update') {
      if (!(isAdmin || isPro)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const { id, ...rest } = data
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      if (isPro && uid) {
        // Pro users can only update their own listings
        const snap = await db.collection('properties').doc(id).get()
        const ownerId = snap.exists ? (snap.data()?.agentId as string | undefined) : undefined
        if (ownerId && ownerId !== uid) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
      await db.collection('properties').doc(id).set({
        ...rest,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true })
      
      // Log property update
      await ActivityLogger.log({
        type: 'property',
        action: 'Property Updated',
        userId: data.agentId || 'unknown',
        userName: data.agentName,
        userEmail: data.agentEmail,
        metadata: {
          propertyId: id,
          title: data.title || data.name,
          updatedFields: Object.keys(data).filter(k => !['id', 'agentId', 'agentName', 'agentEmail'].includes(k))
        }
      })
      
      return NextResponse.json({ success: true, message: "Property updated" })
    } else if (action === 'delete') {
      if (!(isAdmin || isPro)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const { id } = data
      if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
      if (!isAdmin && isPro && uid) {
        // Only admins can delete others' listings; pros can only delete their own
        const snap = await db.collection('properties').doc(id).get()
        const ownerId = snap.exists ? (snap.data()?.agentId as string | undefined) : undefined
        if (ownerId && ownerId !== uid) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
      await db.collection('properties').doc(id).delete()
      
      // Log property deletion
      await ActivityLogger.log({
        type: 'property',
        action: 'Property Deleted',
        userId: data.agentId || 'unknown',
        userName: data.agentName,
        userEmail: data.agentEmail,
        metadata: {
          propertyId: id,
          title: data.title || data.name
        }
      })
      
      return NextResponse.json({ success: true, message: "Property deleted" })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error managing property:', error)
    return NextResponse.json({ error: error.message || 'Failed to manage property' }, { status: 500 })
  }
}
