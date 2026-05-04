'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiMapPin, FiPhone, FiMail, FiHome, FiSearch, FiBookmark } from 'react-icons/fi'

interface SavedSearch {
  id: string
  label: string
  frequency: string
  status: string
  marketingOptIn: boolean
  createdAt?: string
  criteria?: Record<string, unknown>
}

interface BuyerCriteria {
  location?: string
  budgetMin?: number
  budgetMax?: number
  bedrooms?: number
  purpose?: string
  amenities?: string[]
  projectOnly?: boolean
}

interface BuyerRecord {
  id: string
  name: string
  email: string
  phone?: string
  status?: string
  lifecycleStage?: 'new' | 'active' | 'nurturing' | 'offer' | 'won' | 'lost'
  engagementScore?: number
  priority?: 'low' | 'medium' | 'high'
  assignedAgentName?: string
  lastContactAt?: string
  nextFollowUpAt?: string
  criteria?: BuyerCriteria
}

interface ListingMatch {
  id: string
  title: string
  price?: number
  beds?: number
  baths?: number
  mt2?: number
  city?: string
  sector?: string
  image?: string
  verified?: boolean
  pricePerM2?: number
}

export default function BuyerDetailPage() {
  const params = useParams()
  const buyerId = params?.id as string

  const [buyer, setBuyer] = useState<BuyerRecord | null>(null)
  const [matches, setMatches] = useState<ListingMatch[]>([])
  const [matchesCount, setMatchesCount] = useState(0)
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingMatches, setSendingMatches] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const [lifecycleStage, setLifecycleStage] = useState<'new' | 'active' | 'nurturing' | 'offer' | 'won' | 'lost'>('new')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [engagementScore, setEngagementScore] = useState(50)
  const [assignedAgentName, setAssignedAgentName] = useState('')
  const [lastContactAt, setLastContactAt] = useState('')
  const [nextFollowUpAt, setNextFollowUpAt] = useState('')

  const loadBuyerData = useCallback(async () => {
    if (!buyerId) return

    try {
      setLoading(true)

      const [buyerRes, matchesRes, searchesRes] = await Promise.all([
        fetch(`/api/crm/buyers/${buyerId}`),
        fetch(`/api/crm/buyers/${buyerId}/matches`),
        fetch(`/api/admin/buyers/${buyerId}/saved-searches`),
      ])

      const buyerData = await buyerRes.json()
      const matchesData = await matchesRes.json()
      const searchesData = await searchesRes.json().catch(() => ({}))

      if (!buyerRes.ok || !buyerData?.ok) {
        throw new Error(buyerData?.error || 'Failed to load buyer')
      }

      if (!matchesRes.ok || !matchesData?.ok) {
        throw new Error(matchesData?.error || 'Failed to load matches')
      }

      setBuyer(buyerData.data)
      setMatches(matchesData.data?.listings || [])
      setMatchesCount(matchesData.data?.listingsCount || 0)
      setSavedSearches(searchesData?.data?.searches || [])

      setLifecycleStage((buyerData.data?.lifecycleStage || 'new') as 'new' | 'active' | 'nurturing' | 'offer' | 'won' | 'lost')
      setPriority((buyerData.data?.priority || 'medium') as 'low' | 'medium' | 'high')
      setEngagementScore(Number(buyerData.data?.engagementScore || 50))
      setAssignedAgentName(String(buyerData.data?.assignedAgentName || ''))
      setLastContactAt(String(buyerData.data?.lastContactAt || '').slice(0, 16))
      setNextFollowUpAt(String(buyerData.data?.nextFollowUpAt || '').slice(0, 16))
    } catch (error) {
      console.error('buyer detail error', error)
      toast.error('No se pudo cargar el comprador')
    } finally {
      setLoading(false)
    }
  }, [buyerId])

  useEffect(() => {
    loadBuyerData()
  }, [loadBuyerData])

  async function sendMatchesEmail() {
    if (!buyerId) return
    try {
      setSendingMatches(true)
      const res = await fetch(`/api/crm/buyers/${buyerId}/send-matches`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to send matches email')
      }
      toast.success(`Email de matches enviado a ${data?.data?.sentTo || 'comprador'}`)
    } catch (error: any) {
      console.error('send matches error', error)
      toast.error(error?.message || 'No se pudo enviar el email de matches')
    } finally {
      setSendingMatches(false)
    }
  }

  async function saveBuyerProfile() {
    if (!buyerId) return
    try {
      setSavingProfile(true)
      const res = await fetch('/api/crm/buyers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: buyerId,
          lifecycleStage,
          priority,
          engagementScore,
          assignedAgentName,
          lastContactAt: lastContactAt || null,
          nextFollowUpAt: nextFollowUpAt || null,
        }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to update buyer profile')
      }

      toast.success('Perfil CRM del comprador actualizado')
      await loadBuyerData()
    } catch (error: any) {
      console.error('save buyer profile error', error)
      toast.error(error?.message || 'Unable to update buyer profile')
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <main className="flex-1 p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/master/buyers"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-[#0B2545] hover:bg-gray-100"
          >
            <FiArrowLeft /> Back to Buyers
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={sendMatchesEmail}
              disabled={sendingMatches || loading}
              className="rounded-lg bg-[#00A676] px-4 py-2 text-sm font-medium text-white hover:bg-[#008f63] disabled:opacity-60"
            >
              {sendingMatches ? 'Sending...' : 'Send Matches Email'}
            </button>
            <button
              onClick={loadBuyerData}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-[#0B2545] hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Cargando datos del comprador...
          </div>
        ) : !buyer ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Comprador no encontrado.
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#0B2545]">{buyer.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">Perfil del comprador y criterios</p>
                </div>
                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {buyer.status || 'active'}
                </span>
              </div>

              <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Buyer CRM Lifecycle</div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  <label className="text-xs text-gray-600">
                    Stage
                    <select
                      value={lifecycleStage}
                      onChange={(event) => setLifecycleStage(event.target.value as 'new' | 'active' | 'nurturing' | 'offer' | 'won' | 'lost')}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="new">new</option>
                      <option value="active">active</option>
                      <option value="nurturing">nurturing</option>
                      <option value="offer">offer</option>
                      <option value="won">won</option>
                      <option value="lost">lost</option>
                    </select>
                  </label>

                  <label className="text-xs text-gray-600">
                    Priority
                    <select
                      value={priority}
                      onChange={(event) => setPriority(event.target.value as 'low' | 'medium' | 'high')}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                  </label>

                  <label className="text-xs text-gray-600">
                    Engagement Score (0-100)
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={engagementScore}
                      onChange={(event) => setEngagementScore(Math.max(0, Math.min(100, Number(event.target.value || 0))))}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="text-xs text-gray-600">
                    Assigned Agent
                    <input
                      value={assignedAgentName}
                      onChange={(event) => setAssignedAgentName(event.target.value)}
                      placeholder="Nombre del agente"
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="text-xs text-gray-600">
                    Last Contact
                    <input
                      type="datetime-local"
                      value={lastContactAt}
                      onChange={(event) => setLastContactAt(event.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="text-xs text-gray-600">
                    Next Follow-up
                    <input
                      type="datetime-local"
                      value={nextFollowUpAt}
                      onChange={(event) => setNextFollowUpAt(event.target.value)}
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <div className="mt-3">
                  <button
                    onClick={saveBuyerProfile}
                    disabled={savingProfile}
                    className="rounded-lg bg-[#0B2545] px-4 py-2 text-sm font-medium text-white hover:bg-[#12355f] disabled:opacity-60"
                  >
                    {savingProfile ? 'Saving...' : 'Save Buyer CRM Profile'}
                  </button>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Contact</div>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="inline-flex items-center gap-2">
                      <FiMail className="text-gray-400" /> {buyer.email}
                    </div>
                    {buyer.phone && (
                      <div className="inline-flex items-center gap-2">
                        <FiPhone className="text-gray-400" /> {buyer.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Criteria</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {buyer.criteria?.location && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                        <FiMapPin /> {buyer.criteria.location}
                      </span>
                    )}
                    {buyer.criteria?.purpose && (
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-blue-700">{buyer.criteria.purpose}</span>
                    )}
                    {buyer.criteria?.bedrooms && (
                      <span className="rounded-full bg-gray-200 px-2 py-1 text-gray-700">{buyer.criteria.bedrooms} beds</span>
                    )}
                    {(buyer.criteria?.budgetMin || buyer.criteria?.budgetMax) && (
                      <span className="rounded-full bg-gray-200 px-2 py-1 text-gray-700">
                        Budget: {buyer.criteria?.budgetMin ? `$${buyer.criteria.budgetMin.toLocaleString()}` : '—'} - {buyer.criteria?.budgetMax ? `$${buyer.criteria.budgetMax.toLocaleString()}` : '—'}
                      </span>
                    )}
                    {buyer.criteria?.projectOnly && (
                      <span className="rounded-full bg-indigo-50 px-2 py-1 text-indigo-700">Projects only</span>
                    )}
                    {!buyer.criteria || Object.keys(buyer.criteria).length === 0 ? (
                      <span className="text-gray-400">No criteria set</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* Saved Searches Section */}
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FiBookmark className="text-[#00A676]" />
                <h2 className="text-xl font-semibold text-[#0B2545]">Búsquedas guardadas</h2>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{savedSearches.length}</span>
              </div>
              {savedSearches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                  Sin búsquedas guardadas para este comprador.
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {savedSearches.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <FiSearch className="text-gray-400 text-xs" />
                          <span className="font-medium text-[#0B2545] text-sm">{s.label || s.id}</span>
                          {s.status === 'paused' && (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">pausada</span>
                          )}
                          {!s.marketingOptIn && (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">mktg desact.</span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">Frecuencia: {s.frequency || 'desactivada'}</div>
                        {s.criteria && Object.keys(s.criteria).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {Object.entries(s.criteria).slice(0, 6).map(([k, v]) => v ? (
                              <span key={k} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{k}: {String(v)}</span>
                            ) : null)}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#0B2545]">Propiedades coincidentes</h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {matchesCount} coincidencias
                </span>
              </div>

              {matches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  Sin propiedades coincidentes para los criterios actuales.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {matches.map((listing) => (
                    <div key={listing.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                      <div className="h-40 w-full bg-gray-100">
                        {listing.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={listing.image} alt={listing.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <FiHome className="text-2xl" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 p-4">
                        <div className="line-clamp-2 font-semibold text-[#0B2545]">{listing.title}</div>
                        <div className="text-sm text-gray-600">
                          {listing.city || 'N/A'}{listing.sector ? `, ${listing.sector}` : ''}
                        </div>
                        <div className="text-sm font-semibold text-[#0B2545]">
                          {listing.price ? `$${listing.price.toLocaleString()}` : 'Price on request'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {listing.beds || 0} beds • {listing.baths || 0} baths • {listing.mt2 || 0} m²
                        </div>
                        <div className="text-xs text-gray-500">Price/m²: {listing.pricePerM2 ? `$${listing.pricePerM2.toLocaleString()}` : 'N/A'}</div>
                        <div className="pt-2">
                          <Link
                            href={`/master/listings/${listing.id}/edit`}
                            className="inline-flex rounded-md bg-[#00A676] px-3 py-2 text-xs font-medium text-white hover:bg-[#008f63]"
                          >
                            Open Listing
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
