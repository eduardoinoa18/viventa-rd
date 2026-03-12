import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SearchResultItem = {
  id: string
  type: 'listing' | 'deal' | 'project' | 'client'
  title: string
  subtitle?: string
  href: string
  meta?: string
}

// ─── Simple contains filter (case-insensitive) ────────────────────────────────

function matches(value: unknown, q: string): boolean {
  return String(value ?? '')
    .toLowerCase()
    .includes(q)
}

// ─── GET /api/search?q=... ────────────────────────────────────────────────────

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')

    const url = new URL(req.url)
    const rawQ = url.searchParams.get('q')?.trim() ?? ''
    const q = rawQ.toLowerCase()
    if (q.length < 2) return NextResponse.json({ ok: true, results: [], query: rawQ })

    const results: SearchResultItem[] = []
    const limit = 5

    // ── 1. Listings ───────────────────────────────────────────────────────────
    try {
      const listingSnap = await db
        .collection('listings')
        .where('status', '==', 'active')
        .limit(50)
        .get()

      let count = 0
      for (const doc of listingSnap.docs) {
        if (count >= limit) break
        const d = doc.data()
        const title = String(d.title ?? d.name ?? '').toLowerCase()
        const address = String(d.address ?? d.location ?? d.ciudad ?? '').toLowerCase()
        const sector = String(d.sector ?? '').toLowerCase()
        if (title.includes(q) || address.includes(q) || sector.includes(q)) {
          results.push({
            id: doc.id,
            type: 'listing',
            title: String(d.title ?? d.name ?? 'Listing'),
            subtitle: [d.ciudad, d.sector].filter(Boolean).join(', ') || d.address || '',
            href: `/listing/${doc.id}`,
            meta: d.price ? `$${Number(d.price).toLocaleString()}` : undefined,
          })
          count++
        }
      }
    } catch { /* listing search is non-critical */ }

    // ── 2. Deals / Transactions (role-gated) ─────────────────────────────────
    if (context.role === 'broker' || context.role === 'agent' || context.role === 'admin') {
      try {
        const txSnap = await db.collection('transactions').limit(100).get()

        let count = 0
        for (const doc of txSnap.docs) {
          if (count >= limit) break
          const d = doc.data()
          // Office gating
          if (context.role === 'broker' && d.officeId !== context.officeId) continue
          if (context.role === 'agent' && d.agentId !== context.uid) continue

          const clientName = String(d.clientName ?? '').toLowerCase()
          const projectId  = String(d.projectId  ?? '').toLowerCase()
          const unitId     = String(d.unitId      ?? '').toLowerCase()
          const notes      = String(d.notes       ?? '').toLowerCase()

          if (clientName.includes(q) || projectId.includes(q) || unitId.includes(q) || notes.includes(q)) {
            results.push({
              id: doc.id,
              type: 'deal',
              title: String(d.clientName ?? 'Deal'),
              subtitle: `Stage: ${d.stage ?? '—'}${d.projectId ? ` · Project: ${String(d.projectId).slice(0, 12)}` : ''}`,
              href: `/dashboard/broker/pipeline`,
              meta: d.salePrice ? `$${Number(d.salePrice).toLocaleString()}` : undefined,
            })
            count++
          }
        }
      } catch { /* deal search non-critical */ }
    }

    // ── 3. Projects ──────────────────────────────────────────────────────────
    try {
      const projectSnap = await db.collection('projects').limit(60).get()

      let count = 0
      for (const doc of projectSnap.docs) {
        if (count >= limit) break
        const d = doc.data()
        const name = String(d.name ?? d.projectName ?? '').toLowerCase()
        const location = String(d.location ?? d.ciudad ?? '').toLowerCase()
        const developer = String(d.developerName ?? d.constructoraName ?? '').toLowerCase()

        if (name.includes(q) || location.includes(q) || developer.includes(q)) {
          results.push({
            id: doc.id,
            type: 'project',
            title: String(d.name ?? d.projectName ?? 'Project'),
            subtitle: [d.location ?? d.ciudad, d.developerName ?? d.constructoraName].filter(Boolean).join(' · '),
            href: `/projects/${doc.id}`,
            meta: d.totalUnits ? `${d.totalUnits} units` : undefined,
          })
          count++
        }
      }
    } catch { /* project search non-critical */ }

    return NextResponse.json({ ok: true, results, query: rawQ })
  } catch (e: any) {
    console.error('[api/search] error', e)
    return NextResponse.json({ ok: false, error: 'Search failed' }, { status: 500 })
  }
}
