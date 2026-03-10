import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'
import { DEAL_DOCUMENT_TYPES } from '@/lib/domain/deal'

export const dynamic = 'force-dynamic'

const ALLOWED_DOCUMENT_TYPES = DEAL_DOCUMENT_TYPES

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function safeLower(value: unknown): string {
  return safeText(value).toLowerCase()
}

function toMillis(value: any): number {
  if (!value) return 0
  if (value instanceof Date) return value.getTime()
  if (typeof value?.toDate === 'function') {
    const date = value.toDate()
    return date instanceof Date ? date.getTime() : 0
  }
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.getTime() : 0
}

type DealDocument = Record<string, any> & {
  id: string
  dealId: string
  createdAt?: unknown
}

async function loadScopedDeal(req: Request, dealId: string) {
  const db = getAdminDb()
  if (!db) {
    return { error: NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 }) }
  }

  const session = await getSessionFromRequest(req)
  if (!session?.uid) {
    return { error: NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 }) }
  }

  const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
  if (context.role !== 'constructora') {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) }
  }

  const dealRef = db.collection('deals').doc(dealId)
  const dealSnap = await dealRef.get()
  if (!dealSnap.exists) {
    return { error: NextResponse.json({ ok: false, error: 'Deal not found' }, { status: 404 }) }
  }

  const scopedCode = safeText(context.constructoraCode || context.professionalCode || context.uid)
  const dealData = dealSnap.data() as Record<string, any>
  if (safeText(dealData.constructoraCode) !== scopedCode) {
    return { error: NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 }) }
  }

  return { db, context, dealRef }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const scoped = await loadScopedDeal(req, params.id)
    if ('error' in scoped) return scoped.error

    const docsSnap = await scoped.dealRef.collection('documents').limit(400).get()
    const documents: DealDocument[] = docsSnap.docs
      .map((doc): DealDocument => ({ id: doc.id, dealId: params.id, ...(doc.data() as Record<string, any>) }))
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))

    return NextResponse.json({ ok: true, documents })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/deals/[id]/documents] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load deal documents' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const scoped = await loadScopedDeal(req, params.id)
    if ('error' in scoped) return scoped.error

    const body = await req.json().catch(() => ({}))
    const type = safeLower(body.type)
    if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(type)) {
      return NextResponse.json({ ok: false, error: 'Invalid document type' }, { status: 400 })
    }

    const fileUrl = safeText(body.fileUrl)
    const fileName = safeText(body.fileName)
    if (!fileUrl || !fileName) {
      return NextResponse.json({ ok: false, error: 'fileUrl and fileName are required' }, { status: 400 })
    }

    const created = await scoped.dealRef.collection('documents').add({
      type,
      fileUrl,
      fileName,
      uploadedBy: scoped.context.uid,
      size: Number(body.size || 0),
      mimeType: safeText(body.mimeType || ''),
      createdAt: new Date(),
    })

    await scoped.dealRef.collection('events').add({
      type: 'document_uploaded',
      actorId: scoped.context.uid,
      metadata: {
        documentId: created.id,
        fileName,
        documentType: type,
      },
      createdAt: new Date(),
    })

    const saved = await created.get()
    return NextResponse.json({ ok: true, document: { id: created.id, dealId: params.id, ...(saved.data() || {}) } }, { status: 201 })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/deals/[id]/documents] POST error', error)
    return NextResponse.json({ ok: false, error: 'Failed to create deal document' }, { status: 500 })
  }
}
