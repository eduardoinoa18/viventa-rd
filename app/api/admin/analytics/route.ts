// app/api/admin/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireMasterSession } from '@/lib/auth/requireMasterSession'
export const dynamic = 'force-dynamic'
import { initializeApp, getApps } from 'firebase/app'
import {
  getFirestore,
  collection,
  getCountFromServer,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore'

function initFirebase() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  }
  const valid = Boolean(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.storageBucket &&
    config.messagingSenderId &&
    config.appId
  )
  if (!valid) return null
  if (!getApps().length) initializeApp(config as any)
  return getFirestore()
}

function mockAnalytics() {
  return {
    totalUsers: 12450,
    totalProperties: 842,
    totalAgents: 58,
    totalRevenue: 0,
    userGrowth: 12,
    propertyGrowth: 8,
    avgResponseTime: 120,
    conversionRate: 3.2,
    popularLocations: [
      { name: 'Santo Domingo', count: 180 },
      { name: 'Santiago', count: 150 },
      { name: 'Punta Cana', count: 120 },
      { name: 'Puerto Plata', count: 80 },
      { name: 'La Romana', count: 60 },
    ],
    topAgents: [
      { name: 'María López', sales: 24, revenue: 1250000 },
      { name: 'Juan Pérez', sales: 19, revenue: 980000 },
      { name: 'Ana Gómez', sales: 15, revenue: 740000 },
    ],
    userActivity: {
      searches: 8420,
      views: 23890,
      favorites: 3120,
      contacts: 480,
    },
    aiInsights: [
      {
        id: 'insight-1',
        type: 'trend',
        title: 'Aumento de interés en Punta Cana',
        description: 'Las búsquedas y vistas de propiedades en Punta Cana crecieron 22% en los últimos 30 días.',
        confidence: 88,
        impact: 'high',
      },
      {
        id: 'insight-2',
        type: 'opportunity',
        title: 'Déficit de alquileres en Santiago',
        description: 'La demanda supera la oferta en alquileres de 2 habitaciones en zonas céntricas de Santiago.',
        confidence: 76,
        impact: 'medium',
      },
      {
        id: 'insight-3',
        type: 'recommendation',
        title: 'Destacar propiedades con 3+ habitaciones',
        description: 'Los usuarios con familia están mostrando mayor conversión en propiedades amplias en Santo Domingo.',
        confidence: 72,
        impact: 'low',
      },
    ],
  }
}

export async function GET(req: NextRequest) {
  const authResult = await requireMasterSession({ roles: ['SUPER_ADMIN','ADMIN','SUPPORT'] })
  if (authResult instanceof Response) return authResult

  const { searchParams } = new URL(req.url)
  const range = (searchParams.get('range') || '30d') as '7d' | '30d' | '90d' | '1y'

  try {
    const db = initFirebase()
    if (!db) {
      return NextResponse.json({ ok: true, data: mockAnalytics(), note: 'Firebase not configured, returning mock analytics' })
    }

    // Basic counts
    const usersCountSnap = await getCountFromServer(collection(db, 'users'))
    const agentsQ = query(collection(db, 'users'), where('role', '==', 'agent'))
    const agentsCountSnap = await getCountFromServer(agentsQ)

    const activePropsQ = query(collection(db, 'properties'), where('status', '==', 'active'))
    const activePropsCountSnap = await getCountFromServer(activePropsQ)

    // Premium professionals (agents + brokers)
    let premiumAgents = 0
    let premiumBrokers = 0
    try {
      const premAgentsQ = query(collection(db, 'users'), where('role', '==', 'agent'), where('plan', '==', 'premium'))
      const premBrokersQ = query(collection(db, 'users'), where('role', '==', 'broker'), where('plan', '==', 'premium'))
      const [pa, pb] = await Promise.all([
        getCountFromServer(premAgentsQ),
        getCountFromServer(premBrokersQ),
      ])
      premiumAgents = pa.data().count || 0
      premiumBrokers = pb.data().count || 0
    } catch {}

    // Leads (property_inquiries)
    const leadsTotalSnap = await getCountFromServer(collection(db, 'property_inquiries'))
    const leadsAssignedSnap = await getCountFromServer(query(collection(db, 'property_inquiries'), where('status', '==', 'assigned')))

    const now = Timestamp.now()
    const millisBack = 24 * 60 * 60 * 1000
    const since = Timestamp.fromMillis(now.toMillis() - millisBack)
    let leads24h = 0
    try {
      const leads24Snap = await getCountFromServer(query(collection(db, 'property_inquiries'), where('createdAt', '>=', since)))
      leads24h = leads24Snap.data().count || 0
    } catch {}

    // Avg assignment time from recent assigned leads
    let avgAssignHours: number | null = null
    try {
      const assignedQ = query(collection(db, 'property_inquiries'), where('status', '==', 'assigned'), orderBy('assignedAt', 'desc'), limit(200))
      const assignedSnap = await getDocs(assignedQ)
      const diffs: number[] = []
      assignedSnap.docs.forEach((d: any) => {
        const x = d.data()
        const c = x.createdAt?.toDate?.()
        const a = x.assignedAt?.toDate?.()
        if (c && a) diffs.push(a.getTime() - c.getTime())
      })
      if (diffs.length) avgAssignHours = Math.round((diffs.reduce((s, v) => s + v, 0) / diffs.length) / (60 * 60 * 1000) * 10) / 10
    } catch {}

    // Sample recent properties to build simple aggregates (limit to reduce cost)
    const recentPropsQ = query(collection(db, 'properties'), orderBy('createdAt', 'desc'), limit(200))
    const recentPropsSnap = await getDocs(recentPropsQ)

    const locationCounts: Record<string, number> = {}
    const agentAgg: Record<string, { sales: number; revenue: number }> = {}

    recentPropsSnap.docs.forEach((d: any) => {
      const p: any = d.data()
      const city = (p.city || p.location || 'Desconocido') as string
      locationCounts[city] = (locationCounts[city] || 0) + 1

      if (p.agentName) {
        const key = p.agentName as string
        if (!agentAgg[key]) agentAgg[key] = { sales: 0, revenue: 0 }
        agentAgg[key].sales += p.status === 'sold' ? 1 : 0
        agentAgg[key].revenue += p.status === 'sold' ? Number(p.price || 0) : 0
      }
    })

    const popularLocations = Object.entries(locationCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))

    const topAgents = Object.entries(agentAgg)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 3)
      .map(([name, agg]) => ({ name, sales: agg.sales, revenue: agg.revenue }))

    const data = {
      totalUsers: usersCountSnap.data().count || 0,
      totalProperties: activePropsCountSnap.data().count || 0,
      totalAgents: agentsCountSnap.data().count || 0,
      totalRevenue: 0, // integrate Stripe later
      userGrowth: 0,   // compute vs previous period later
      propertyGrowth: 0,
      avgResponseTime: 120,
      conversionRate: 0,
      popularLocations: popularLocations.length ? popularLocations : mockAnalytics().popularLocations,
      topAgents: topAgents.length ? topAgents : mockAnalytics().topAgents,
      userActivity: {
        searches: 0,
        views: 0,
        favorites: 0,
        contacts: 0,
      },
      premiumPros: { agents: premiumAgents, brokers: premiumBrokers },
      leads: {
        total: leadsTotalSnap.data().count || 0,
        assigned: leadsAssignedSnap.data().count || 0,
        unassigned: (leadsTotalSnap.data().count || 0) - (leadsAssignedSnap.data().count || 0),
        last24h: leads24h,
        avgAssignHours,
      },
      aiInsights: mockAnalytics().aiInsights,
    }

    return NextResponse.json({ ok: true, data, range })
  } catch (e: any) {
    console.error('admin analytics GET error', e)
    return NextResponse.json({ ok: true, data: mockAnalytics(), note: 'Error computing analytics, returning mock' })
  }
}
