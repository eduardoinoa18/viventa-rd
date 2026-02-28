import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { AdminAuthError, requireMasterAdmin } from '@/lib/requireMasterAdmin'

export const dynamic = 'force-dynamic'

type LeadRecord = {
  id: string
  status?: string
  source?: string
  sourceId?: string
  assignedTo?: string | null
  createdAt?: any
  assignedAt?: any
}

type UserRecord = {
  id: string
  role?: string
  name?: string
  brokerage?: string
  company?: string
}

function toMillis(value: any): number {
  if (!value) return 0
  if (typeof value?.toMillis === 'function') return value.toMillis()
  if (typeof value?.seconds === 'number') return value.seconds * 1000
  const parsed = new Date(value).getTime()
  return Number.isFinite(parsed) ? parsed : 0
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

function avg(values: number[]) {
  if (!values.length) return 0
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2))
}

function trendPct(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

export async function GET(req: NextRequest) {
  try {
    await requireMasterAdmin(req)

    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: false, error: 'Admin SDK not configured' }, { status: 503 })
    }

    const settingsSnap = await db.collection('settings').doc('admin').get()
    const settings = settingsSnap.exists ? (settingsSnap.data() || {}) : {}
    const escalationHours = Math.max(1, Number(settings.controlEscalationHours || 2))

    const [leadsSnap, usersSnap, propertiesSnap] = await Promise.all([
      db.collection('leads').get(),
      db.collection('users').where('role', 'in', ['agent', 'broker', 'master_admin', 'admin']).get(),
      db.collection('properties').get(),
    ])

    const leads: LeadRecord[] = leadsSnap.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }))
    const users: UserRecord[] = usersSnap.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() || {}) }))
    const propertyById = new Map<string, any>(propertiesSnap.docs.map((doc: any) => [doc.id, doc.data() || {}]))
    const userById = new Map<string, UserRecord>(users.map((u) => [u.id, u]))

    const now = Date.now()
    const ms7d = 7 * 24 * 60 * 60 * 1000
    const ms30d = 30 * 24 * 60 * 60 * 1000
    const ms48h = 48 * 60 * 60 * 1000

    const leads7d = leads.filter((lead) => now - toMillis(lead.createdAt) <= ms7d)
    const leads30d = leads.filter((lead) => now - toMillis(lead.createdAt) <= ms30d)
    const leadsPrev7d = leads.filter((lead) => {
      const age = now - toMillis(lead.createdAt)
      return age > ms7d && age <= ms7d * 2
    })

    const assignmentLatencyHours = leads30d
      .filter((lead) => lead.assignedAt)
      .map((lead) => {
        const created = toMillis(lead.createdAt)
        const assigned = toMillis(lead.assignedAt)
        if (!created || !assigned || assigned < created) return null
        return (assigned - created) / (1000 * 60 * 60)
      })
      .filter((value): value is number => value !== null)

    const assignedWithinSla = assignmentLatencyHours.filter((hours) => hours <= escalationHours).length
    const slaComplianceRate = pct(assignedWithinSla, assignmentLatencyHours.length)

    const escalated30d = leads30d.filter((lead) => {
      const created = toMillis(lead.createdAt)
      if (!created) return false
      const isUnassigned = !lead.assignedTo && (lead.status || 'unassigned') === 'unassigned'
      const ageHours = (now - created) / (1000 * 60 * 60)
      return isUnassigned && ageHours >= escalationHours
    })

    const activePipelineCount = leads30d.filter((lead) => ['unassigned', 'assigned', 'contacted'].includes(lead.status || 'unassigned')).length

    const qualifiedStatuses = new Set(['contacted', 'won', 'lost'])
    const qualified30d = leads30d.filter((lead) => qualifiedStatuses.has(lead.status || '')).length
    const won30d = leads30d.filter((lead) => (lead.status || '') === 'won').length

    const leadsToQualifiedRate = pct(qualified30d, leads30d.length)
    const qualifiedToDealRate = pct(won30d, qualified30d)

    type PerfStats = {
      key: string
      name: string
      assigned: number
      won: number
      late: number
      avgLatencyHours: number
      conversionRate: number
      slaRate: number
    }

    const agentStats = new Map<string, { assigned: number; won: number; late: number; latency: number[] }>()
    const brokerStats = new Map<string, { assigned: number; won: number; late: number; latency: number[] }>()

    for (const lead of leads30d) {
      const assigneeId = String(lead.assignedTo || '')
      if (!assigneeId) continue

      const assignee = userById.get(assigneeId)
      const created = toMillis(lead.createdAt)
      const assigned = toMillis(lead.assignedAt)
      const latencyHours = created && assigned && assigned >= created ? (assigned - created) / (1000 * 60 * 60) : null
      const late = latencyHours !== null ? latencyHours > escalationHours : false
      const won = (lead.status || '') === 'won'

      const aBase = agentStats.get(assigneeId) || { assigned: 0, won: 0, late: 0, latency: [] }
      aBase.assigned += 1
      if (won) aBase.won += 1
      if (late) aBase.late += 1
      if (latencyHours !== null) aBase.latency.push(latencyHours)
      agentStats.set(assigneeId, aBase)

      const brokerKeyRaw = assignee?.role === 'broker'
        ? (assignee.name || assignee.id)
        : (assignee?.brokerage || assignee?.company || 'Independent')
      const brokerKey = String(brokerKeyRaw || 'Independent')

      const bBase = brokerStats.get(brokerKey) || { assigned: 0, won: 0, late: 0, latency: [] }
      bBase.assigned += 1
      if (won) bBase.won += 1
      if (late) bBase.late += 1
      if (latencyHours !== null) bBase.latency.push(latencyHours)
      brokerStats.set(brokerKey, bBase)
    }

    const buildPerf = (entries: Array<[string, { assigned: number; won: number; late: number; latency: number[] }]>, nameResolver: (key: string) => string): PerfStats[] => {
      return entries.map(([key, value]) => {
        const conversionRate = pct(value.won, value.assigned)
        const slaRate = pct(value.assigned - value.late, value.assigned)
        return {
          key,
          name: nameResolver(key),
          assigned: value.assigned,
          won: value.won,
          late: value.late,
          avgLatencyHours: avg(value.latency),
          conversionRate,
          slaRate,
        }
      })
    }

    const agentPerf = buildPerf(Array.from(agentStats.entries()), (key) => userById.get(key)?.name || key)
    const brokerPerf = buildPerf(Array.from(brokerStats.entries()), (key) => key)

    const topAgent = [...agentPerf].sort((a, b) => b.conversionRate - a.conversionRate || b.assigned - a.assigned)[0] || null
    const topBroker = [...brokerPerf].sort((a, b) => b.conversionRate - a.conversionRate || b.assigned - a.assigned)[0] || null
    const worstSlaBroker = [...brokerPerf]
      .filter((b) => b.assigned >= 3)
      .sort((a, b) => a.slaRate - b.slaRate || b.assigned - a.assigned)[0] || null

    const sourceMap = new Map<string, number>()
    const sectorMap = new Map<string, number>()
    const typeMap = new Map<string, number>()

    for (const lead of leads30d) {
      const source = String(lead.source || 'unknown')
      sourceMap.set(source, (sourceMap.get(source) || 0) + 1)

      const prop = lead.sourceId ? propertyById.get(String(lead.sourceId)) : null
      const sector = String(prop?.neighborhood || prop?.sector || 'N/A')
      const pType = String(prop?.propertyType || 'N/A')

      sectorMap.set(sector, (sectorMap.get(sector) || 0) + 1)
      typeMap.set(pType, (typeMap.get(pType) || 0) + 1)
    }

    const toTop = (map: Map<string, number>, max = 5) =>
      Array.from(map.entries())
        .map(([label, value]) => ({ label, value, ratio: pct(value, leads30d.length) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, max)

    const agingOver48h = leads.filter((lead) => {
      const created = toMillis(lead.createdAt)
      if (!created) return false
      const isOpen = ['unassigned', 'assigned', 'contacted'].includes(lead.status || 'unassigned')
      return isOpen && (now - created) > ms48h
    }).length

    const slowAgents = [...agentPerf]
      .filter((a) => a.assigned >= 3)
      .sort((a, b) => b.avgLatencyHours - a.avgLatencyHours)
      .slice(0, 5)

    const highEscalationBrokers = [...brokerPerf]
      .filter((b) => b.assigned >= 3)
      .map((b) => ({ ...b, escalationRate: pct(b.late, b.assigned) }))
      .sort((a, b) => b.escalationRate - a.escalationRate)
      .slice(0, 5)

    return NextResponse.json({
      ok: true,
      data: {
        generatedAt: new Date().toISOString(),
        slaHours: escalationHours,
        operationalHealth: {
          slaComplianceRate,
          avgAssignmentHours: avg(assignmentLatencyHours),
          escalationRate: pct(escalated30d.length, leads30d.length),
        },
        volumeFlow: {
          leads7d: leads7d.length,
          leads30d: leads30d.length,
          velocityTrend7dPct: trendPct(leads7d.length, leadsPrev7d.length),
          activePipelineCount,
        },
        performance: {
          leadsToQualifiedRate,
          qualifiedToDealRate,
          topBroker,
          topAgent,
          worstSlaBroker,
        },
        valueSources: {
          topSources: toTop(sourceMap, 5),
          topSectors: toTop(sectorMap, 5),
          topPropertyTypes: toTop(typeMap, 5),
        },
        risk: {
          agingOver48h,
          slowAgents,
          highEscalationBrokers,
        },
      },
    })
  } catch (error: any) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status }
      )
    }

    console.error('[admin/overview] Error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to load overview' }, { status: 500 })
  }
}
