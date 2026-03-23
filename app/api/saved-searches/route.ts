import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'
import {
  listSavedSearches,
  createSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
} from '@/lib/savedSearchService'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const searches = await listSavedSearches(session.uid)
    return NextResponse.json({ ok: true, searches })
  } catch (error: any) {
    console.error('[saved-searches] GET', error)
    return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { label, criteria, frequency, marketingOptIn, locale } = body

    if (!criteria || typeof criteria !== 'object') {
      return NextResponse.json({ error: 'criteria is required' }, { status: 400 })
    }

    const search = await createSavedSearch(session.uid, {
      label: String(label || '').trim() || 'Búsqueda guardada',
      criteria,
      frequency,
      marketingOptIn: Boolean(marketingOptIn),
      locale: String(locale || 'es-DO'),
    })

    return NextResponse.json({ ok: true, search }, { status: 201 })
  } catch (error: any) {
    if (error?.message?.includes('Maximum')) {
      return NextResponse.json({ error: error.message }, { status: 422 })
    }
    console.error('[saved-searches] POST', error)
    return NextResponse.json({ error: 'Failed to create saved search' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { searchId, ...patch } = body

    if (!searchId || typeof searchId !== 'string') {
      return NextResponse.json({ error: 'searchId is required' }, { status: 400 })
    }

    const allowed = ['label', 'criteria', 'frequency', 'marketingOptIn', 'status']
    const safePatch = Object.fromEntries(
      Object.entries(patch).filter(([k]) => allowed.includes(k))
    )

    await updateSavedSearch(session.uid, searchId, safePatch)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[saved-searches] PATCH', error)
    return NextResponse.json({ error: 'Failed to update saved search' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const searchId = searchParams.get('searchId')

    if (!searchId) {
      return NextResponse.json({ error: 'searchId is required' }, { status: 400 })
    }

    await deleteSavedSearch(session.uid, searchId)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[saved-searches] DELETE', error)
    return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 })
  }
}
