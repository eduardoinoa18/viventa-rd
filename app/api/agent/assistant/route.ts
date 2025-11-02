// app/api/agent/assistant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAllProperties, type Property } from '../../../../lib/firestoreService'

type Preferences = {
  budgetMin?: number
  budgetMax?: number
  location?: string
  bedrooms?: number
  propertyType?: Property['propertyType']
}

function scoreProperty(p: Property, prefs: Preferences): number {
  let score = 50

  // Budget fit (closer to middle of range is better)
  if (prefs.budgetMin != null || prefs.budgetMax != null) {
    const min = prefs.budgetMin ?? 0
    const max = prefs.budgetMax ?? Number.MAX_SAFE_INTEGER
    if (p.price >= min && p.price <= max) {
      const mid = (min + max) / 2
      const dist = Math.abs(p.price - mid)
      const span = Math.max(1, max - min)
      const closeness = 1 - Math.min(1, dist / span)
      score += Math.round(closeness * 25)
    } else {
      // Penalize if outside range
      score -= 20
    }
  }

  // Location match (substring, case-insensitive)
  if (prefs.location) {
    const loc = (p as any).city || p.location || ''
    if (loc.toLowerCase().includes(prefs.location.toLowerCase())) {
      score += 10
    } else {
      score -= 5
    }
  }

  // Bedrooms (at least requested)
  if (prefs.bedrooms != null) {
    if (p.bedrooms >= prefs.bedrooms) {
      const extra = Math.min(2, p.bedrooms - prefs.bedrooms)
      score += 5 + extra * 2
    } else {
      score -= 10
    }
  }

  // Property type exact match
  if (prefs.propertyType) {
    if (p.propertyType === prefs.propertyType) score += 10
    else score -= 5
  }

  // Featured boost
  if (p.featured) score += 5

  return Math.max(0, Math.min(100, score))
}

function computeLeadScore(matches: number, prefs: Preferences): number {
  let base = 40
  if (prefs.location) base += 10
  if (prefs.bedrooms != null) base += 10
  if (prefs.budgetMin != null || prefs.budgetMax != null) base += 10
  if (prefs.propertyType) base += 5
  base += Math.min(25, matches * 4)
  return Math.max(20, Math.min(95, base))
}

function summarizeInsights(props: Property[]) {
  const byCity: Record<string, number> = {}
  for (const p of props) {
    const city = ((p as any).city || p.location || 'Desconocido') as string
    byCity[city] = (byCity[city] || 0) + 1
  }
  const top = Object.entries(byCity).sort((a,b)=>b[1]-a[1]).slice(0,3)
  const insights: string[] = []
  if (top.length) {
    insights.push(`Mayor inventario en ${top.map(([c])=>c).join(', ')}`)
  }
  const avgPrice = props.length ? Math.round(props.reduce((s,p)=>s + Number(p.price||0),0) / props.length) : 0
  if (avgPrice > 0) insights.push(`Precio promedio de listados activos: RD$ ${avgPrice.toLocaleString('es-DO')}`)
  return insights
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prefs: Preferences = body?.preferences || {}

    let all: Property[] = []
    try {
      all = await getAllProperties(200)
    } catch (e) {
      // Fallback if Firebase not configured
      all = []
    }

    if (!all || all.length === 0) {
      // Return mock suggestions when no data available
      const mock = [
        { id: 'm1', title: 'Apartamento moderno en Santo Domingo', location: 'Santo Domingo', price: 145000, bedrooms: 3, bathrooms: 2, area: 120, propertyType: 'apartment', listingType: 'sale', images: [], agentId: 'a1', agentName: 'Agente Demo', status: 'active' as const },
        { id: 'm2', title: 'Villa con piscina en Punta Cana', location: 'Punta Cana', price: 350000, bedrooms: 4, bathrooms: 3, area: 280, propertyType: 'house', listingType: 'sale', images: [], agentId: 'a2', agentName: 'Agente Demo', status: 'active' as const },
        { id: 'm3', title: 'Condo céntrico en Santiago', location: 'Santiago', price: 1200, bedrooms: 2, bathrooms: 2, area: 90, propertyType: 'condo', listingType: 'rent', images: [], agentId: 'a3', agentName: 'Agente Demo', status: 'active' as const },
      ]
      const scored = mock.map((p) => ({ property: p as any as Property, score: scoreProperty(p as any as Property, prefs) }))
      const sorted = scored.sort((a,b)=>b.score - a.score)
      return NextResponse.json({ ok: true, leadScore: computeLeadScore(sorted.length, prefs), suggestions: sorted.map(s=>({ ...s.property, score: s.score })), outreachTips: [
        'Responder en menos de 5 minutos aumenta conversiones ~8x',
        'Personaliza tu mensaje mencionando 1-2 detalles del inmueble',
        'Ofrece 2-3 alternativas cercanas en precio/ubicación'
      ], marketInsights: ['Datos de ejemplo generados por falta de conexión a Firebase'] })
    }

    // Score and filter
    const filtered = all
      .filter(p => p.status === 'active')
      .map(p => ({ property: p, score: scoreProperty(p, prefs) }))
      .sort((a,b)=>b.score - a.score)

    // Optional hard filters if provided
    const hardFiltered = filtered.filter(({ property: p }) => {
      if (prefs.budgetMin != null && p.price < prefs.budgetMin) return false
      if (prefs.budgetMax != null && p.price > prefs.budgetMax) return false
      if (prefs.location && !(((p as any).city || p.location || '').toLowerCase().includes(prefs.location.toLowerCase()))) return false
      if (prefs.bedrooms != null && p.bedrooms < prefs.bedrooms) return false
      if (prefs.propertyType && p.propertyType !== prefs.propertyType) return false
      return true
    })

    const top = (hardFiltered.length ? hardFiltered : filtered).slice(0, 10)
    const suggestions = top.map(t => ({ ...t.property, score: t.score }))

    const leadScore = computeLeadScore(suggestions.length, prefs)
    const marketInsights = summarizeInsights(all)
    const outreachTips = [
      'Responde en menos de 5 minutos para multiplicar la conversión',
      'Propón 2-3 opciones alternativas con variaciones de precio/ubicación',
      'Agenda una llamada breve para entender mejor prioridades del cliente'
    ]

    return NextResponse.json({ ok: true, leadScore, suggestions, outreachTips, marketInsights })
  } catch (e: any) {
    console.error('agent assistant POST error', e)
    return NextResponse.json({ ok: false, error: 'Failed to compute suggestions' }, { status: 500 })
  }
}
