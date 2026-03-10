import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
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

  return { context, dealRef }
}

export async function DELETE(req: Request, { params }: { params: { id: string; docId: string } }) {
  try {
    const scoped = await loadScopedDeal(req, params.id)
    if ('error' in scoped) return scoped.error

    const docRef = scoped.dealRef.collection('documents').doc(params.docId)
    const docSnap = await docRef.get()
    if (!docSnap.exists) {
      return NextResponse.json({ ok: false, error: 'Document not found' }, { status: 404 })
    }

    const docData = docSnap.data() as Record<string, any>
    await docRef.delete()

    await scoped.dealRef.collection('events').add({
      type: 'document_uploaded',
      actorId: scoped.context.uid,
      metadata: {
        action: 'deleted',
        documentId: params.docId,
        fileName: safeText(docData.fileName || ''),
      },
      createdAt: new Date(),
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[api/constructora/dashboard/deals/[id]/documents/[docId]] DELETE error', error)
    return NextResponse.json({ ok: false, error: 'Failed to delete deal document' }, { status: 500 })
  }
}
