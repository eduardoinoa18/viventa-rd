import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

type SavedSearch = {
  id?: string
  userId: string
  name: string
  criteria: {
    city?: string
    sector?: string
    minPrice?: number
    maxPrice?: number
    minArea?: number
    maxArea?: number
    bedrooms?: number
    bathrooms?: number
    propertyType?: string
    listingType?: 'rent' | 'sell'
    amenities?: string[]
  }
  alertsEnabled: boolean
  createdAt?: string
  updatedAt?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const snapshot = await db
      .collection('saved_searches')
      .where('userId', '==', session.uid)
      .orderBy('createdAt', 'desc')
      .get()

    const searches = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    return NextResponse.json({ data: searches })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const body: SavedSearch = await request.json()

    if (!body.name || !body.criteria) {
      return NextResponse.json(
        { error: 'Name and criteria are required' },
        { status: 400 }
      )
    }

    const newSearch = {
      userId: session.uid,
      name: body.name,
      criteria: body.criteria,
      alertsEnabled: body.alertsEnabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const docRef = await db.collection('saved_searches').add(newSearch)

    return NextResponse.json(
      { data: { id: docRef.id, ...newSearch } },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to create saved search' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const body: SavedSearch = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify ownership
    const existingDoc = await db.collection('saved_searches').doc(body.id).get()
    if (!existingDoc.exists || existingDoc.data()?.userId !== session.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    const updateData = {
      name: body.name,
      criteria: body.criteria,
      alertsEnabled: body.alertsEnabled,
      updatedAt: new Date().toISOString(),
    }

    await db.collection('saved_searches').doc(body.id).update(updateData)

    return NextResponse.json({
      data: { id: body.id, ...existingDoc.data(), ...updateData },
    })
  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Server config error' }, { status: 500 })
    }

    const searchId = request.nextUrl.searchParams.get('id')
    if (!searchId) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // Verify ownership
    const doc = await db.collection('saved_searches').doc(searchId).get()
    if (!doc.exists || doc.data()?.userId !== session.uid) {
      return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 })
    }

    await db.collection('saved_searches').doc(searchId).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    )
  }
}
