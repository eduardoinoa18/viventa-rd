'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import BottomNav from '@/components/BottomNav'
import PropertyCard from '@/components/PropertyCard'
import {
  buildSearchUrl,
  getSavedPropertyIds,
  getSavedSearches,
  removeSavedSearch,
  type SavedSearchCriteria,
} from '@/lib/buyerPreferences'

type SessionData = {
  uid: string
  role: string
  name?: string
}

type ListingItem = {
  id: string
  title?: string
  price?: number
  currency?: 'USD' | 'DOP'
  city?: string
  status?: string
}

type BrokerDashboardKpi = {
  generatedAt?: string
  performance?: {
    totalActiveListings?: number
    newListings30Days?: number
    pendingListings?: number
    closedListings30Days?: number
    avgDaysOnMarket?: number
    officeConversionRate?: number
    leadToAppointmentRate?: number
    leadToCloseRate?: number
  }
  leads?: {
    leadsAssigned?: number
    responseTimeAvgMinutes?: number
    slaBreaches?: number
    contactRate?: number
    qualificationRate?: number
  }
  market?: {
    dominantCity?: string
    medianPriceInArea?: number
    avgDomInMarket?: number
    activeVsPendingRatio?: number
    priceTrend30vsPrev30Pct?: number
  }
}

type BrokerTeamSummary = {
  totalMembers?: number
  activeMembers?: number
  pendingMembers?: number
}

type BrokerTransactionsSummary = {
  totalPipeline?: number
  qualified?: number
  negotiating?: number
  won?: number
  projectedValue?: number
  pendingCommissions?: number
  paidCommissions?: number
  monthlyProjection?: number
  stages?: {
    lead?: number
    showing?: number
    oferta?: number
    enNegociacion?: number
    contratoFirmado?: number
    cierre?: number
    completado?: number
  }
}

type AgentDashboardOverview = {
  summary?: {
    activeListings?: number
    soldLast30Days?: number
    leadsAssigned?: number
    newLeadsLast30Days?: number
    leadsWon?: number
    pipelineOpen?: number
    leadToCloseRate?: number
    avgResponseMinutes?: number
  }
  recentActivity?: Array<{
    id: string
    type: string
    title: string
    status: string
    at?: string | null
  }>
}

type ConstructoraDashboardOverview = {
  summary?: {
    totalProjects?: number
    activeProjects?: number
    totalUnits?: number
    availableUnits?: number
    reservedUnits?: number
    soldUnits?: number
    inProcessUnits?: number
  }
  topCities?: Array<{ city: string; projects: number }>
  recentProjects?: Array<{
    id: string
    name: string
    city?: string
    status?: string
    availableUnits?: number
    totalUnits?: number
  }>
}

type BrokerTeamMember = {
  id: string
  name: string
  role: string
  status: string
}

type BrokerLeadItem = {
  id: string
  buyerName?: string
  buyerEmail?: string
  leadStage?: string
  ownerAgentId?: string | null
  createdAt?: string | null
}

function formatPrice(value?: number, currency: 'USD' | 'DOP' = 'USD') {
  if (!value || Number.isNaN(Number(value))) return 'Precio no disponible'
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value))
}

export default function BuyerDashboardPage() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [savedPropertyIds, setSavedPropertyIds] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearchCriteria[]>([])
  const [savedProperties, setSavedProperties] = useState<any[]>([])
  const [myListings, setMyListings] = useState<ListingItem[]>([])
  const [officeListings, setOfficeListings] = useState<ListingItem[]>([])
  const [marketListings, setMarketListings] = useState<ListingItem[]>([])
  const [proListingsLoading, setProListingsLoading] = useState(false)
  const [proListingsError, setProListingsError] = useState('')
  const [brokerKpis, setBrokerKpis] = useState<BrokerDashboardKpi | null>(null)
  const [brokerTeamSummary, setBrokerTeamSummary] = useState<BrokerTeamSummary | null>(null)
  const [brokerTransactionsSummary, setBrokerTransactionsSummary] = useState<BrokerTransactionsSummary | null>(null)
  const [brokerTeamMembers, setBrokerTeamMembers] = useState<BrokerTeamMember[]>([])
  const [brokerLeads, setBrokerLeads] = useState<BrokerLeadItem[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [selectedAssignAgentId, setSelectedAssignAgentId] = useState('')
  const [selectedLeadStage, setSelectedLeadStage] = useState('contacted')
  const [leadActionReason, setLeadActionReason] = useState('')
  const [leadActionStatus, setLeadActionStatus] = useState('')
  const [leadActionLoading, setLeadActionLoading] = useState(false)
  const [agentOverview, setAgentOverview] = useState<AgentDashboardOverview | null>(null)
  const [constructoraOverview, setConstructoraOverview] = useState<ConstructoraDashboardOverview | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok) {
          setSession(null)
          return
        }

        setSession(json.session || null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  useEffect(() => {
    if (!session) return
    const nextIds = getSavedPropertyIds()
    const nextSearches = getSavedSearches()
    setSavedPropertyIds(nextIds)
    setSavedSearches(nextSearches)
  }, [session])

  useEffect(() => {
    if (!savedPropertyIds.length) {
      setSavedProperties([])
      return
    }

    let active = true
    const loadProperties = async () => {
      const responses = await Promise.all(
        savedPropertyIds.map(async (id) => {
          const res = await fetch(`/api/properties/${encodeURIComponent(id)}`, { cache: 'no-store' })
          const json = await res.json().catch(() => ({}))
          if (!res.ok || !json?.ok || !json?.data) return null
          return json.data
        })
      )

      if (!active) return
      setSavedProperties(responses.filter(Boolean))
    }

    loadProperties()
    return () => {
      active = false
    }
  }, [savedPropertyIds])

  useEffect(() => {
    if (!session || (session.role !== 'agent' && session.role !== 'broker')) return

    let active = true
    const loadProfessionalListings = async () => {
      try {
        setProListingsLoading(true)
        setProListingsError('')

        const [myRes, officeRes, marketRes, kpiRes, teamRes, transactionsRes, leadsRes] = await Promise.all([
          fetch('/api/broker/listings/my?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/office?status=active', { cache: 'no-store' }),
          fetch('/api/broker/listings/market?status=active', { cache: 'no-store' }),
          fetch('/api/broker/dashboard/overview', { cache: 'no-store' }),
          fetch('/api/broker/team', { cache: 'no-store' }),
          fetch('/api/broker/transactions', { cache: 'no-store' }),
          fetch('/api/broker/leads?limit=20', { cache: 'no-store' }),
        ])

        const [myJson, officeJson, marketJson, kpiJson, teamJson, transactionsJson, leadsJson] = await Promise.all([
          myRes.json().catch(() => ({})),
          officeRes.json().catch(() => ({})),
          marketRes.json().catch(() => ({})),
          kpiRes.json().catch(() => ({})),
          teamRes.json().catch(() => ({})),
          transactionsRes.json().catch(() => ({})),
          leadsRes.json().catch(() => ({})),
        ])

        if (!active) return

        if (!myRes.ok) {
          throw new Error(myJson?.error || 'No se pudo cargar tus listados')
        }

        setMyListings(Array.isArray(myJson?.listings) ? myJson.listings : [])

        if (officeRes.ok) {
          setOfficeListings(Array.isArray(officeJson?.listings) ? officeJson.listings : [])
        } else {
          setOfficeListings([])
        }

        if (marketRes.ok) {
          setMarketListings(Array.isArray(marketJson?.listings) ? marketJson.listings : [])
        } else {
          setMarketListings([])
        }

        if (kpiRes.ok) {
          setBrokerKpis(kpiJson || null)
        } else {
          setBrokerKpis(null)
        }

        if (teamRes.ok) {
          setBrokerTeamSummary(teamJson?.summary || null)
          setBrokerTeamMembers(Array.isArray(teamJson?.members) ? teamJson.members : [])
        } else {
          setBrokerTeamSummary(null)
          setBrokerTeamMembers([])
        }

        if (transactionsRes.ok) {
          setBrokerTransactionsSummary(transactionsJson?.summary || null)
        } else {
          setBrokerTransactionsSummary(null)
        }

        if (leadsRes.ok) {
          const nextLeads = Array.isArray(leadsJson?.leads) ? leadsJson.leads : []
          setBrokerLeads(nextLeads)
          if (!selectedLeadId && nextLeads[0]?.id) {
            setSelectedLeadId(nextLeads[0].id)
          }
        } else {
          setBrokerLeads([])
        }

        if (session.role === 'agent') {
          const agentOverviewRes = await fetch('/api/agent/dashboard/overview', { cache: 'no-store' })
          const agentOverviewJson = await agentOverviewRes.json().catch(() => ({}))
          if (agentOverviewRes.ok && agentOverviewJson?.ok) {
            setAgentOverview(agentOverviewJson)
          } else {
            setAgentOverview(null)
          }
        } else {
          setAgentOverview(null)
        }
      } catch (error: any) {
        if (!active) return
        setProListingsError(error?.message || 'No se pudo cargar el panel profesional')
        setMyListings([])
        setOfficeListings([])
        setMarketListings([])
        setBrokerKpis(null)
        setBrokerTeamSummary(null)
        setBrokerTransactionsSummary(null)
        setBrokerTeamMembers([])
        setBrokerLeads([])
        setAgentOverview(null)
      } finally {
        if (active) setProListingsLoading(false)
      }
    }

    loadProfessionalListings()
    return () => {
      active = false
    }
  }, [session, selectedLeadId])

  useEffect(() => {
    if (!session || session.role !== 'constructora') return

    let active = true
    const loadConstructoraOverview = async () => {
      try {
        setProListingsLoading(true)
        setProListingsError('')

        const res = await fetch('/api/constructora/dashboard/overview', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!active) return

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || 'No se pudo cargar el panel de constructora')
        }

        setConstructoraOverview(json)
      } catch (error: any) {
        if (!active) return
        setConstructoraOverview(null)
        setProListingsError(error?.message || 'No se pudo cargar el panel de constructora')
      } finally {
        if (active) setProListingsLoading(false)
      }
    }

    loadConstructoraOverview()
    return () => {
      active = false
    }
  }, [session])

  async function refreshLeadOps() {
    const [leadsRes, txRes] = await Promise.all([
      fetch('/api/broker/leads?limit=20', { cache: 'no-store' }),
      fetch('/api/broker/transactions', { cache: 'no-store' }),
    ])

    const leadsJson = await leadsRes.json().catch(() => ({}))
    const txJson = await txRes.json().catch(() => ({}))

    if (leadsRes.ok) {
      const nextLeads = Array.isArray(leadsJson?.leads) ? leadsJson.leads : []
      setBrokerLeads(nextLeads)
      if (!selectedLeadId && nextLeads[0]?.id) {
        setSelectedLeadId(nextLeads[0].id)
      }
    }

    if (txRes.ok) {
      setBrokerTransactionsSummary(txJson?.summary || null)
    }
  }

  async function handleAssignLead() {
    if (!selectedLeadId || !selectedAssignAgentId) {
      setLeadActionStatus('Selecciona lead y agente para asignar.')
      return
    }

    try {
      setLeadActionLoading(true)
      setLeadActionStatus('')
      const res = await fetch('/api/broker/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          leadId: selectedLeadId,
          ownerAgentId: selectedAssignAgentId,
          reason: leadActionReason || 'manual_assignment',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo asignar el lead')
      }
      setLeadActionStatus('Lead asignado correctamente.')
      await refreshLeadOps()
    } catch (error: any) {
      setLeadActionStatus(error?.message || 'No se pudo asignar el lead')
    } finally {
      setLeadActionLoading(false)
    }
  }

  async function handleMoveLeadStage() {
    if (!selectedLeadId || !selectedLeadStage) {
      setLeadActionStatus('Selecciona lead y etapa para actualizar.')
      return
    }

    try {
      setLeadActionLoading(true)
      setLeadActionStatus('')
      const res = await fetch('/api/broker/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'stage',
          leadId: selectedLeadId,
          leadStage: selectedLeadStage,
          reason: leadActionReason || 'manual_stage_update',
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo mover la etapa')
      }
      setLeadActionStatus('Etapa del lead actualizada.')
      await refreshLeadOps()
    } catch (error: any) {
      setLeadActionStatus(error?.message || 'No se pudo mover la etapa')
    } finally {
      setLeadActionLoading(false)
    }
  }

  const displayName = session?.name || 'Comprador'
  const isBuyerRole = session?.role === 'buyer' || session?.role === 'user'
  const isProfessionalRole = session?.role === 'agent' || session?.role === 'broker'
  const isConstructoraRole = session?.role === 'constructora'

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-gray-600">Cargando tu panel...</div>
        </main>
        <Footer />
        <BottomNav />
      </>
    )
  }

  if (!session) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md w-full text-center">
            <h1 className="text-xl font-semibold text-[#0B2545]">Inicia sesión para ver tu panel</h1>
            <p className="text-gray-600 text-sm mt-2">Guarda propiedades y tus criterios de búsqueda en un solo lugar.</p>
            <Link href="/login?redirect=/dashboard" className="mt-4 inline-flex px-4 py-2 rounded-lg bg-[#00A676] text-white font-medium">
              Ir a iniciar sesión
            </Link>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </>
    )
  }

  if (isProfessionalRole) {
    const roleLabel = session.role === 'broker' ? 'Broker' : 'Agente'

    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Panel profesional</h1>
              <p className="text-sm text-gray-600 mt-1">Hola, {displayName}. Vista principal para {roleLabel.toLowerCase()} con tus listados, oficina y mercado.</p>
              <div className="mt-3">
                <Link href="/dashboard/settings" className="inline-flex px-4 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-semibold hover:bg-[#133a66] transition-colors">
                  Editar perfil público
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <div className="text-xs text-gray-500">Mis listados activos</div>
                  <div className="text-lg font-bold text-[#0B2545]">{myListings.length}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <div className="text-xs text-gray-500">Listados de oficina</div>
                  <div className="text-lg font-bold text-[#0B2545]">{officeListings.length}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <div className="text-xs text-gray-500">Oportunidades de mercado</div>
                  <div className="text-lg font-bold text-[#0B2545]">{marketListings.length}</div>
                </div>
              </div>

              {brokerKpis?.performance && (
                <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-[#0B2545]/5 border border-[#0B2545]/10 p-3">
                    <div className="text-xs text-gray-600">Nuevos (30d)</div>
                    <div className="text-lg font-bold text-[#0B2545]">{brokerKpis.performance.newListings30Days || 0}</div>
                  </div>
                  <div className="rounded-lg bg-[#0B2545]/5 border border-[#0B2545]/10 p-3">
                    <div className="text-xs text-gray-600">Cerrados (30d)</div>
                    <div className="text-lg font-bold text-[#0B2545]">{brokerKpis.performance.closedListings30Days || 0}</div>
                  </div>
                  <div className="rounded-lg bg-[#0B2545]/5 border border-[#0B2545]/10 p-3">
                    <div className="text-xs text-gray-600">DOM promedio</div>
                    <div className="text-lg font-bold text-[#0B2545]">{brokerKpis.performance.avgDaysOnMarket || 0}</div>
                  </div>
                  <div className="rounded-lg bg-[#0B2545]/5 border border-[#0B2545]/10 p-3">
                    <div className="text-xs text-gray-600">Conversión oficina</div>
                    <div className="text-lg font-bold text-[#0B2545]">{brokerKpis.performance.officeConversionRate || 0}%</div>
                  </div>
                </div>
              )}

              {brokerKpis?.leads && (
                <div className="mt-3 grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-[#00A676]/5 border border-[#00A676]/20 p-3">
                    <div className="text-xs text-gray-600">Leads asignados</div>
                    <div className="text-lg font-bold text-[#0B2545]">{brokerKpis.leads.leadsAssigned || 0}</div>
                  </div>
                  <div className="rounded-lg bg-[#00A676]/5 border border-[#00A676]/20 p-3">
                    <div className="text-xs text-gray-600">Resp. promedio</div>
                    <div className="text-lg font-bold text-[#0B2545]">{brokerKpis.leads.responseTimeAvgMinutes || 0} min</div>
                  </div>
                  <div className="rounded-lg bg-[#00A676]/5 border border-[#00A676]/20 p-3">
                    <div className="text-xs text-gray-600">Contact rate</div>
                    <div className="text-lg font-bold text-[#0B2545]">{brokerKpis.leads.contactRate || 0}%</div>
                  </div>
                  <div className="rounded-lg bg-[#00A676]/5 border border-[#00A676]/20 p-3">
                    <div className="text-xs text-gray-600">Lead to close</div>
                    <div className="text-lg font-bold text-[#0B2545]">{brokerKpis.performance?.leadToCloseRate || 0}%</div>
                  </div>
                </div>
              )}

              {brokerKpis?.market && (
                <div className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg p-3">
                  Mercado {brokerKpis.market.dominantCity || 'RD'} • Mediana: {formatPrice(brokerKpis.market.medianPriceInArea, 'USD')} • Tendencia 30d: {brokerKpis.market.priceTrend30vsPrev30Pct || 0}%
                </div>
              )}

              {(brokerTeamSummary || brokerTransactionsSummary) && (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-100 bg-white p-3">
                    <div className="text-xs text-gray-500">Team (Phase 4)</div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                      <div className="rounded bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Total</div>
                        <div className="font-bold text-[#0B2545]">{brokerTeamSummary?.totalMembers || 0}</div>
                      </div>
                      <div className="rounded bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Activos</div>
                        <div className="font-bold text-[#0B2545]">{brokerTeamSummary?.activeMembers || 0}</div>
                      </div>
                      <div className="rounded bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Pendientes</div>
                        <div className="font-bold text-[#0B2545]">{brokerTeamSummary?.pendingMembers || 0}</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-100 bg-white p-3">
                    <div className="text-xs text-gray-500">Transactions (Phase 4)</div>
                    <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
                      <div className="rounded bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Pipeline</div>
                        <div className="font-bold text-[#0B2545]">{brokerTransactionsSummary?.totalPipeline || 0}</div>
                      </div>
                      <div className="rounded bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Qualified</div>
                        <div className="font-bold text-[#0B2545]">{brokerTransactionsSummary?.qualified || 0}</div>
                      </div>
                      <div className="rounded bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Negotiating</div>
                        <div className="font-bold text-[#0B2545]">{brokerTransactionsSummary?.negotiating || 0}</div>
                      </div>
                      <div className="rounded bg-gray-50 p-2">
                        <div className="text-[11px] text-gray-500">Won</div>
                        <div className="font-bold text-[#0B2545]">{brokerTransactionsSummary?.won || 0}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Valor proyectado: {formatPrice(brokerTransactionsSummary?.projectedValue, 'USD')}
                    </div>
                    {session.role === 'broker' && (
                      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                        <div className="rounded bg-gray-50 p-2">
                          <div className="text-[11px] text-gray-500">Com. pendiente</div>
                          <div className="font-bold text-[#0B2545]">{formatPrice(brokerTransactionsSummary?.pendingCommissions, 'USD')}</div>
                        </div>
                        <div className="rounded bg-gray-50 p-2">
                          <div className="text-[11px] text-gray-500">Com. pagada</div>
                          <div className="font-bold text-[#0B2545]">{formatPrice(brokerTransactionsSummary?.paidCommissions, 'USD')}</div>
                        </div>
                        <div className="rounded bg-gray-50 p-2">
                          <div className="text-[11px] text-gray-500">Proyección mes</div>
                          <div className="font-bold text-[#0B2545]">{formatPrice(brokerTransactionsSummary?.monthlyProjection, 'USD')}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {session.role === 'agent' && agentOverview?.summary && (
                <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3">
                  <div className="text-xs text-gray-500">Rendimiento personal (Agente)</div>
                  <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div className="rounded bg-gray-50 p-2">
                      <div className="text-[11px] text-gray-500">Activos</div>
                      <div className="font-bold text-[#0B2545]">{agentOverview.summary.activeListings || 0}</div>
                    </div>
                    <div className="rounded bg-gray-50 p-2">
                      <div className="text-[11px] text-gray-500">Nuevos leads 30d</div>
                      <div className="font-bold text-[#0B2545]">{agentOverview.summary.newLeadsLast30Days || 0}</div>
                    </div>
                    <div className="rounded bg-gray-50 p-2">
                      <div className="text-[11px] text-gray-500">Leads ganados</div>
                      <div className="font-bold text-[#0B2545]">{agentOverview.summary.leadsWon || 0}</div>
                    </div>
                    <div className="rounded bg-gray-50 p-2">
                      <div className="text-[11px] text-gray-500">Resp. promedio</div>
                      <div className="font-bold text-[#0B2545]">{agentOverview.summary.avgResponseMinutes || 0} min</div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 rounded-lg border border-gray-100 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#0B2545]">Quick Actions (Phase 4.1)</h3>
                  <span className="text-[11px] text-gray-500">Leads + Transactions</span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Lead</label>
                    <select
                      aria-label="Seleccionar lead"
                      value={selectedLeadId}
                      onChange={(e) => setSelectedLeadId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Seleccionar lead</option>
                      {brokerLeads.map((lead) => (
                        <option key={lead.id} value={lead.id}>
                          {lead.buyerName || 'Lead'} • {lead.leadStage || 'new'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Razón (opcional)</label>
                    <input
                      value={leadActionReason}
                      onChange={(e) => setLeadActionReason(e.target.value)}
                      placeholder="Ej: balanceo de carga"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>

                  {session.role === 'broker' && (
                    <>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Asignar a agente</label>
                        <select
                          aria-label="Seleccionar agente para asignación"
                          value={selectedAssignAgentId}
                          onChange={(e) => setSelectedAssignAgentId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        >
                          <option value="">Seleccionar agente</option>
                          {brokerTeamMembers
                            .filter((member) => member.status === 'active')
                            .map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.name} ({member.role})
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAssignLead}
                          disabled={leadActionLoading}
                          className="w-full px-3 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium disabled:opacity-50"
                        >
                          Asignar lead
                        </button>
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Mover etapa</label>
                    <select
                      aria-label="Seleccionar etapa del lead"
                      value={selectedLeadStage}
                      onChange={(e) => setSelectedLeadStage(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="assigned">assigned</option>
                      <option value="contacted">contacted</option>
                      <option value="qualified">qualified</option>
                      <option value="negotiating">negotiating</option>
                      <option value="won">won</option>
                      <option value="lost">lost</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleMoveLeadStage}
                      disabled={leadActionLoading}
                      className="w-full px-3 py-2 rounded-lg bg-[#00A676] text-white text-sm font-medium disabled:opacity-50"
                    >
                      Actualizar etapa
                    </button>
                  </div>
                </div>

                {leadActionStatus && (
                  <p className="mt-2 text-xs text-gray-600">{leadActionStatus}</p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/master/listings" className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium">Gestionar listados</Link>
                <Link href="/master/listings/create" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Crear listado</Link>
                {session.role === 'broker' && (
                  <Link href="/api/broker/mls?limit=50" className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">MLS interno (API)</Link>
                )}
              </div>
            </section>

            {proListingsLoading && (
              <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-600">
                Cargando listados profesionales...
              </section>
            )}

            {proListingsError && (
              <section className="bg-white rounded-xl border border-red-100 shadow-sm p-4 text-sm text-red-700">
                {proListingsError}
              </section>
            )}

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-semibold text-[#0B2545]">Mis listados</h2>
                <Link href="/master/listings" className="text-sm text-[#00A676] font-medium">Ver todos</Link>
              </div>
              {myListings.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no tienes listados activos.</p>
              ) : (
                <div className="space-y-2">
                  {myListings.slice(0, 6).map((listing) => (
                    <Link key={listing.id} href={`/listing/${listing.id}`} className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-semibold text-[#0B2545]">{listing.title || 'Listado sin título'}</div>
                      <div className="text-xs text-gray-600 mt-1">{formatPrice(listing.price, listing.currency || 'USD')} • {listing.city || 'RD'} • {listing.status || 'active'}</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-semibold text-[#0B2545]">Oficina</h2>
              </div>
              {officeListings.length === 0 ? (
                <p className="text-sm text-gray-500">No hay listados de oficina disponibles o tu perfil aún no está asociado a una oficina.</p>
              ) : (
                <div className="space-y-2">
                  {officeListings.slice(0, 6).map((listing) => (
                    <Link key={listing.id} href={`/listing/${listing.id}`} className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-semibold text-[#0B2545]">{listing.title || 'Listado sin título'}</div>
                      <div className="text-xs text-gray-600 mt-1">{formatPrice(listing.price, listing.currency || 'USD')} • {listing.city || 'RD'}</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-semibold text-[#0B2545]">Mercado</h2>
                <Link href="/search" className="text-sm text-[#00A676] font-medium">Explorar</Link>
              </div>
              {marketListings.length === 0 ? (
                <p className="text-sm text-gray-500">No hay oportunidades de mercado para mostrar ahora mismo.</p>
              ) : (
                <div className="space-y-2">
                  {marketListings.slice(0, 6).map((listing) => (
                    <Link key={listing.id} href={`/listing/${listing.id}`} className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-semibold text-[#0B2545]">{listing.title || 'Listado sin título'}</div>
                      <div className="text-xs text-gray-600 mt-1">{formatPrice(listing.price, listing.currency || 'USD')} • {listing.city || 'RD'}</div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
        <Footer />
        <BottomNav />
      </>
    )
  }

  if (isConstructoraRole) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
          <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Panel de Constructora</h1>
              <p className="text-sm text-gray-600 mt-1">Hola, {displayName}. Controla proyectos, inventario y reservas con enfoque RD.</p>
              <div className="mt-3">
                <Link href="/dashboard/settings" className="inline-flex px-4 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-semibold hover:bg-[#133a66] transition-colors">
                  Editar perfil público
                </Link>
              </div>

              <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <div className="text-xs text-gray-500">Proyectos activos</div>
                  <div className="text-lg font-bold text-[#0B2545]">{constructoraOverview?.summary?.activeProjects || 0}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <div className="text-xs text-gray-500">Unidades disponibles</div>
                  <div className="text-lg font-bold text-[#0B2545]">{constructoraOverview?.summary?.availableUnits || 0}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <div className="text-xs text-gray-500">Unidades reservadas</div>
                  <div className="text-lg font-bold text-[#0B2545]">{constructoraOverview?.summary?.reservedUnits || 0}</div>
                </div>
                <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                  <div className="text-xs text-gray-500">Unidades vendidas</div>
                  <div className="text-lg font-bold text-[#0B2545]">{constructoraOverview?.summary?.soldUnits || 0}</div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h2 className="text-lg font-semibold text-[#0B2545]">Proyectos recientes</h2>
                <Link href="/constructoras" className="text-sm text-[#00A676] font-medium">Vista pública</Link>
              </div>
              {!constructoraOverview?.recentProjects?.length ? (
                <p className="text-sm text-gray-500">No hay proyectos vinculados a tu constructora todavía.</p>
              ) : (
                <div className="space-y-2">
                  {constructoraOverview.recentProjects.map((project) => (
                    <Link key={project.id} href={`/projects/${project.id}`} className="block rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
                      <div className="text-sm font-semibold text-[#0B2545]">{project.name}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {project.city || 'RD'} • {project.availableUnits || 0}/{project.totalUnits || 0} unidades disponibles
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {constructoraOverview?.topCities?.length ? (
              <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <h2 className="text-lg font-semibold text-[#0B2545] mb-3">Huella por ciudad</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {constructoraOverview.topCities.map((item) => (
                    <div key={item.city} className="rounded-lg border border-gray-200 p-3">
                      <div className="text-sm font-semibold text-[#0B2545]">{item.city}</div>
                      <div className="text-xs text-gray-600">{item.projects} proyecto(s)</div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </main>
        <Footer />
        <BottomNav />
      </>
    )
  }

  if (!isBuyerRole) {
  // Fallback: Unknown role (should not happen with proper auth)
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-[#0B2545]">Rol no reconocido</h1>
          <p className="text-gray-600 text-sm mt-2">Tu cuenta tiene un rol que no está configurado para este panel. Contacta a soporte.</p>
          <div className="mt-4 text-xs text-gray-500">Rol: {session.role}</div>
          <Link href="/search" className="mt-4 inline-flex px-4 py-2 rounded-lg bg-[#0B2545] text-white font-medium">
            Ir a búsqueda
          </Link>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 pb-20 md:pb-8">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sticky top-20 z-20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Link href="/search" className="text-center px-3 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium">Buscar</Link>
              <Link href="/favorites" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Favoritos</Link>
              <Link href="/messages" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Mensajes</Link>
              <Link href="/contact" className="text-center px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Ayuda</Link>
            </div>
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0B2545]">Hola, {displayName}</h1>
            <p className="text-sm text-gray-600 mt-1">Tu panel para guardar propiedades y seguir tus búsquedas.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <div className="text-xs text-gray-500">Propiedades guardadas</div>
                <div className="text-lg font-bold text-[#0B2545]">{savedPropertyIds.length}</div>
              </div>
              <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
                <div className="text-xs text-gray-500">Búsquedas guardadas</div>
                <div className="text-lg font-bold text-[#0B2545]">{savedSearches.length}</div>
              </div>
            </div>
          </section>

          {savedPropertyIds.length === 0 && savedSearches.length === 0 && (
            <section className="bg-gradient-to-r from-[#0B2545] to-[#134074] rounded-xl border border-[#0B2545]/20 shadow-sm p-4 sm:p-5 text-white">
              <h2 className="text-lg font-semibold">Configura tu panel en 1 minuto</h2>
              <p className="text-sm text-white/90 mt-1">Guarda una búsqueda y tu primera propiedad para recibir recomendaciones más relevantes.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/search" className="px-3 py-2 rounded-lg bg-white text-[#0B2545] text-sm font-medium">Guardar primera búsqueda</Link>
                <Link href="/search" className="px-3 py-2 rounded-lg border border-white/40 text-sm font-medium">Explorar propiedades</Link>
              </div>
            </section>
          )}

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-[#0B2545]">Búsquedas guardadas</h2>
              <Link href="/search" className="text-sm text-[#00A676] font-medium">Nueva búsqueda</Link>
            </div>
            {savedSearches.length === 0 ? (
              <p className="text-sm text-gray-500">Aún no tienes búsquedas guardadas. Desde buscar propiedades puedes guardar tus criterios.</p>
            ) : (
              <div className="space-y-2">
                {savedSearches.map((item) => (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[#0B2545] truncate">{item.name}</div>
                      <div className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={buildSearchUrl(item)} className="text-xs px-3 py-1.5 rounded-md border border-gray-300 hover:bg-gray-50">
                        Abrir
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSavedSearches(removeSavedSearch(item.id))}
                        className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-lg font-semibold text-[#0B2545]">Propiedades guardadas</h2>
              <Link href="/search" className="text-sm text-[#00A676] font-medium">Explorar más</Link>
            </div>
            {savedProperties.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-sm text-gray-500">
                Guarda propiedades desde las tarjetas en búsqueda para verlas aquí.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                {savedProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  )
}
