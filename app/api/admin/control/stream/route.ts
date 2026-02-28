import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

type LeadType = 'request-info' | 'request-call' | 'whatsapp' | 'showing'

type LeadDoc = {
  id: string
  type: LeadType
  source: 'property' | 'project' | 'agent' | string
  sourceId?: string
  buyerName?: string
  buyerEmail?: string
  buyerPhone?: string
  message?: string
  status?: 'unassigned' | 'assigned' | 'contacted' | 'won' | 'lost' | string
  assignedTo?: string | null
  createdAt?: any
  updatedAt?: any
}

type UserDoc = {
  id: string
  name?: string
  email?: string
  role?: string
  brokerage?: string
  company?: string
  markets?: string
  sectors?: string[]
  city?: string
  neighborhood?: string
  lastLoginAt?: any
  updatedAt?: any
  status?: string
  disabled?: boolean
}

type ReassignmentPolicy = {
  manualReassignEnabled: boolean
  suggestNewAssigneeEnabled: boolean
  brokerFallbackEnabled: boolean
  escalationLogEnabled: boolean
}

function toMillis(value: any): number {
  if (!value) return 0
  if (typeof value?.toMillis === 'function') return value.toMillis()
  if (typeof value?.seconds === 'number') return value.seconds * 1000
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function slaLabel(ageHours: number) {
  if (ageHours < 1) return { label: '< 1h', color: 'green' as const }
  if (ageHours < 6) return { label: '1-6h', color: 'yellow' as const }
  return { label: '6h+', color: 'red' as const }
}

function urgencyScore(lead: LeadDoc, ageHours: number) {
  const typeWeight: Record<string, number> = {
    'request-call': 24,
    showing: 22,
    whatsapp: 18,
    'request-info': 12,
  }

  const ageWeight = Math.min(60, Math.round(ageHours * 8))
  const contactWeight = lead.buyerPhone ? 8 : 4
  const messageWeight = lead.message && lead.message.length > 40 ? 6 : 2
  const statusWeight = lead.status === 'unassigned' ? 12 : 0

  return Math.min(100, ageWeight + (typeWeight[lead.type] || 10) + contactWeight + messageWeight + statusWeight)
}

function makeCoverageText(user: UserDoc) {
  return [
    user.markets || '',
    Array.isArray(user.sectors) ? user.sectors.join(' ') : '',
    user.city || '',
    user.neighborhood || '',
    user.brokerage || '',
    user.company || '',
  ]
    .join(' ')
    .toLowerCase()
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const { searchParams } = new URL(req.url)
    const limit = Math.min(200, Math.max(20, Number(searchParams.get('limit') || 80)))
    const queueStatus = searchParams.get('status')?.trim() || 'unassigned'

    const settingsSnap = await db.collection('settings').doc('admin').get()
    const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {}
    const escalationHours = Math.max(1, Number(settings.controlEscalationHours || 2))
    const reassignmentPolicy: ReassignmentPolicy = {
      manualReassignEnabled: settings?.reassignmentPolicy?.manualReassignEnabled ?? true,
      suggestNewAssigneeEnabled: settings?.reassignmentPolicy?.suggestNewAssigneeEnabled ?? true,
      brokerFallbackEnabled: settings?.reassignmentPolicy?.brokerFallbackEnabled ?? true,
      escalationLogEnabled: settings?.reassignmentPolicy?.escalationLogEnabled ?? true,
    }

    let leadsRef: any = db.collection('leads')
    if (queueStatus !== 'all') leadsRef = leadsRef.where('status', '==', queueStatus)

    let leadSnap: any
    try {
      leadSnap = await leadsRef.orderBy('createdAt', 'desc').limit(limit).get()
    } catch {
      leadSnap = await leadsRef.get()
    }

    const leads: LeadDoc[] = leadSnap.docs
      .map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }))
      .slice(0, limit)

    const sourceIds = Array.from(
      new Set(
        leads
          .filter((lead) => (lead.source === 'property' || lead.source === 'project') && lead.sourceId)
          .map((lead) => String(lead.sourceId))
      )
    )

    const propertyById = new Map<string, any>()
    if (sourceIds.length > 0) {
      const propertySnaps = await Promise.all(sourceIds.map((id) => db.collection('properties').doc(id).get()))
      for (const snap of propertySnaps) {
        if (snap.exists) propertyById.set(snap.id, snap.data() || {})
      }
    }

    const usersSnap = await db.collection('users').where('role', 'in', ['agent', 'broker']).get()
    const users: UserDoc[] = usersSnap.docs
      .map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }))
      .filter((user) => !user.disabled && user.status !== 'inactive' && user.status !== 'suspended')

    const loadByAgent = new Map<string, number>()
    const wonByAgent = new Map<string, number>()
    const assignedByAgent = new Map<string, number>()

    const allLeadSnap = await db.collection('leads').get()
    for (const doc of allLeadSnap.docs) {
      const lead = doc.data() || {}
      const assignedTo = String(lead.assignedTo || '')
      if (!assignedTo) continue

      if (lead.status === 'assigned' || lead.status === 'contacted') {
        loadByAgent.set(assignedTo, (loadByAgent.get(assignedTo) || 0) + 1)
      }

      assignedByAgent.set(assignedTo, (assignedByAgent.get(assignedTo) || 0) + 1)
      if (lead.status === 'won') {
        wonByAgent.set(assignedTo, (wonByAgent.get(assignedTo) || 0) + 1)
      }
    }

    const now = Date.now()

    const stream = leads.map((lead) => {
      const createdAtMs = toMillis(lead.createdAt)
      const ageHours = createdAtMs > 0 ? (now - createdAtMs) / (1000 * 60 * 60) : 0
      const property = lead.sourceId ? propertyById.get(String(lead.sourceId)) : null

      const sector = property?.neighborhood || property?.sector || ''
      const city = property?.city || ''
      const propertyType = property?.propertyType || ''

      const score = urgencyScore(lead, ageHours)
      const sla = slaLabel(ageHours)
      const escalated = (lead.status || 'unassigned') === 'unassigned' && ageHours >= escalationHours
      const escalationLevel = !escalated ? 'none' : ageHours >= 6 ? 'critical' : 'warning'

      const suggestions = users
        .map((user) => {
          const coverageText = makeCoverageText(user)
          const activeLoad = loadByAgent.get(user.id) || 0
          const won = wonByAgent.get(user.id) || 0
          const assignedTotal = assignedByAgent.get(user.id) || 0
          const conversionRate = assignedTotal > 0 ? won / assignedTotal : 0
          const lastActiveMs = Math.max(toMillis(user.lastLoginAt), toMillis(user.updatedAt))
          const hoursSinceActive = lastActiveMs > 0 ? (now - lastActiveMs) / (1000 * 60 * 60) : 999

          let fit = 50
          if (city && coverageText.includes(String(city).toLowerCase())) fit += 20
          if (sector && coverageText.includes(String(sector).toLowerCase())) fit += 20
          if (propertyType && coverageText.includes(String(propertyType).toLowerCase())) fit += 10

          fit += Math.round(conversionRate * 30)
          if (hoursSinceActive <= 24) fit += 10
          else if (hoursSinceActive <= 72) fit += 5

          fit -= activeLoad * 8

          return {
            agentId: user.id,
            agentName: user.name || user.email || 'Agent',
            brokerage: user.brokerage || user.company || '',
            activeLoad,
            conversionRate: Number((conversionRate * 100).toFixed(1)),
            hoursSinceActive: Number(hoursSinceActive.toFixed(1)),
            fitScore: fit,
          }
        })
        .sort((a, b) => b.fitScore - a.fitScore)
        .slice(0, 3)

      return {
        ...lead,
        ageHours: Number(ageHours.toFixed(1)),
        sla,
        escalated,
        escalationLevel,
        urgencyScore: score,
        city,
        sector,
        propertyType,
        suggestions,
      }
    })

    const queueStats = {
      total: stream.length,
      red: stream.filter((lead) => lead.sla.color === 'red').length,
      yellow: stream.filter((lead) => lead.sla.color === 'yellow').length,
      green: stream.filter((lead) => lead.sla.color === 'green').length,
      escalated: stream.filter((lead) => lead.escalated).length,
      avgUrgency: stream.length > 0 ? Number((stream.reduce((sum, lead) => sum + lead.urgencyScore, 0) / stream.length).toFixed(1)) : 0,
    }

    return NextResponse.json({
      ok: true,
      data: {
        queueStats,
        escalationHours,
        reassignmentPolicy,
        stream,
      },
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ ok: false, error: error.message, code: error.code }, { status: error.status })
    }

    console.error('[admin/control/stream] Error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to load control stream' }, { status: 500 })
  }
}
