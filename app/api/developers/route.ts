/**
 * Developers (Constructoras) API
 * CRUD operations for real estate developers
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { withMasterAdmin } from '@/lib/requireMasterAdmin'
import { FieldValue } from 'firebase-admin/firestore'
import type { Developer } from '@/types/developer'

export const dynamic = 'force-dynamic'

// GET /api/developers - List all developers (public)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'active'
    const featured = searchParams.get('featured')

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

    let query = db.collection('developers').where('status', '==', status)
    
    if (featured === 'true') {
      query = query.where('featured', '==', true)
    }

    const snapshot = await query.get()
    const developers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    return NextResponse.json({ ok: true, developers })
  } catch (error: any) {
    console.error('Error fetching developers:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch developers' },
      { status: 500 }
    )
  }
}

// POST /api/developers - Create or update developer (admin only)
export async function POST(req: NextRequest) {
  return withMasterAdmin(req, async (admin) => {
    try {
      const body = await req.json()
      const { id, action, ...data } = body

      const db = getAdminDb()
      if (!db) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
      }

      // Validate required fields
      if (!data.companyName) {
        return NextResponse.json(
          { error: 'Company name is required' },
          { status: 400 }
        )
      }

      // Generate slug from company name if not provided
      if (!data.slug) {
        data.slug = data.companyName
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }

      if (action === 'update' && id) {
        // Update existing developer
        const docRef = db.collection('developers').doc(id)
        const doc = await docRef.get()

        if (!doc.exists) {
          return NextResponse.json({ error: 'Developer not found' }, { status: 404 })
        }

        await docRef.update({
          ...data,
          updatedAt: FieldValue.serverTimestamp(),
        })

        return NextResponse.json({
          ok: true,
          message: 'Developer updated successfully',
          id
        })
      } else {
        // Create new developer
        const developerData: Partial<Developer> = {
          ...data,
          verified: data.verified ?? false,
          featured: data.featured ?? false,
          status: data.status || 'active',
          createdBy: admin.uid,
          createdAt: FieldValue.serverTimestamp() as any,
          updatedAt: FieldValue.serverTimestamp() as any,
        }

        const docRef = await db.collection('developers').add(developerData)

        return NextResponse.json({
          ok: true,
          message: 'Developer created successfully',
          id: docRef.id
        })
      }
    } catch (error: any) {
      console.error('Error managing developer:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to manage developer' },
        { status: 500 }
      )
    }
  })
}

// DELETE /api/developers - Delete developer (admin only)
export async function DELETE(req: NextRequest) {
  return withMasterAdmin(req, async () => {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')

      if (!id) {
        return NextResponse.json({ error: 'Developer ID required' }, { status: 400 })
      }

      const db = getAdminDb()
      if (!db) {
        return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
      }

      // Check if developer has associated listings
      const listingsSnapshot = await db
        .collection('properties')
        .where('developerId', '==', id)
        .limit(1)
        .get()

      if (!listingsSnapshot.empty) {
        return NextResponse.json(
          { error: 'Cannot delete developer with associated listings' },
          { status: 400 }
        )
      }

      await db.collection('developers').doc(id).delete()

      return NextResponse.json({
        ok: true,
        message: 'Developer deleted successfully'
      })
    } catch (error: any) {
      console.error('Error deleting developer:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete developer' },
        { status: 500 }
      )
    }
  })
}
