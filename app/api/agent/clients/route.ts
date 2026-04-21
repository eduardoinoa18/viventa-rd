import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function safeLower(value: unknown): string {
  return safeText(value).toLowerCase()
}

function toNumber(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
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

function toIso(value: any): string | null {
  const ms = toMillis(value)
  return ms ? new Date(ms).toISOString() : null
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const q = safeLower(searchParams.get('q') || '')

    // Fetch leads assigned to this agent
    const leadsSnap = await db
      .collection('leads')
      .limit(2500)
      .get()

    const agentLeads = leadsSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, any>) }))
      .filter((lead) => {
        const ownerId = safeText(lead.ownerAgentId || lead.assignedTo || lead.assignedTo?.uid)
        return ownerId === context.uid
      })

    // Fetch transactions for this agent to count active deals per client
    const txSnap = await db
      .collection('transactions')
      .where('officeId', '==', context.officeId)
      .where('agentId', '==', context.uid)
      .limit(1500)
      .get()

    // Build active deals count by buyer email
    const activeDealsByEmail: Record<string, number> = {}
    for (const doc of txSnap.docs) {
      const data = doc.data() as Record<string, any>
      const email = safeLower(data.buyerEmail || data.clientEmail || '')
      const stage = safeLower(data.stage || data.status || '')
      const isActive = !['completed', 'won', 'closed', 'cancelled'].includes(stage)
      if (email && isActive) {
        activeDealsByEmail[email] = (activeDealsByEmail[email] || 0) + 1
      }
    }

    // Deduplicate leads into clients by email
    const seen = new Set<string>()
    const nowMs = Date.now()

    let clients = agentLeads
      .map((lead) => {
        const email = safeLower(lead.buyerEmail || lead.email || '')
        const name = safeText(lead.buyerName || lead.name || lead.fullName || 'Cliente')
        const phone = safeText(lead.buyerPhone || lead.phone || '')
        const city = safeText(lead.city || lead.buyerCity || '')
        const stage = safeLower(lead.leadStage || lead.status || 'new')
        const createdAt = toIso(lead.createdAt)
        const prefs = Array.isArray(lead.preferences) ? lead.preferences.length : toNumber(lead.preferencesCount)
        const activeDeals = email ? (activeDealsByEmail[email] || 0) : 0
        const dedupeKey = email || lead.id

        return {
          id: lead.id,
          name,
          email,
          phone,
          city,
          stage,
          preferencesCount: prefs,
          activeDeals,
          createdAt,
          _dedupeKey: dedupeKey,
          _createdMs: toMillis(lead.createdAt),
        }
      })
      .filter((client) => {
        if (seen.has(client._dedupeKey)) return false
        seen.add(client._dedupeKey)
        return true
      })
      .map(({ _dedupeKey, _createdMs, ...rest }) => rest)
      .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt))

    // Apply search filter
    if (q) {
      clients = clients.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q),
      )
    }

    // Summary stats from unfiltered client list
    const total = clients.length
    const active = clients.filter((c) => !['lost', 'won', 'closed'].includes(safeLower(c.stage))).length
    const newClients = leadsSnap.docs.filter((doc) => {
      const data = doc.data() as Record<string, any>
      const ownerId = safeText(data.ownerAgentId || data.assignedTo || '')
      return ownerId === context.uid && toMillis(data.createdAt) >= nowMs - THIRTY_DAYS_MS
    }).length

    return NextResponse.json({
      ok: true,
      summary: {
        total,
        active,
        new: newClients,
      },
      clients: clients.slice(0, 200),
    })
  } catch (error: any) {
    console.error('[api/agent/clients] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load agent clients' }, { status: 500 })
  }
}
