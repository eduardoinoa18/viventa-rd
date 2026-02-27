'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiArrowLeft, FiMapPin, FiPhone, FiMail, FiHome } from 'react-icons/fi'

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
  const [loading, setLoading] = useState(true)
  const [sendingMatches, setSendingMatches] = useState(false)

  const loadBuyerData = useCallback(async () => {
    if (!buyerId) return

    try {
      setLoading(true)

      const [buyerRes, matchesRes] = await Promise.all([
        fetch(`/api/crm/buyers/${buyerId}`),
        fetch(`/api/crm/buyers/${buyerId}/matches`),
      ])

      const buyerData = await buyerRes.json()
      const matchesData = await matchesRes.json()

      if (!buyerRes.ok || !buyerData?.ok) {
        throw new Error(buyerData?.error || 'Failed to load buyer')
      }

      if (!matchesRes.ok || !matchesData?.ok) {
        throw new Error(matchesData?.error || 'Failed to load matches')
      }

      setBuyer(buyerData.data)
      setMatches(matchesData.data?.listings || [])
      setMatchesCount(matchesData.data?.listingsCount || 0)
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
      toast.success(`Matches email sent to ${data?.data?.sentTo || 'buyer'}`)
    } catch (error: any) {
      console.error('send matches error', error)
      toast.error(error?.message || 'No se pudo enviar el email de matches')
    } finally {
      setSendingMatches(false)
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
            Loading buyer data...
          </div>
        ) : !buyer ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
            Buyer not found.
          </div>
        ) : (
          <>
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#0B2545]">{buyer.name}</h1>
                  <p className="mt-1 text-sm text-gray-500">Buyer profile and criteria</p>
                </div>
                <span className="inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {buyer.status || 'active'}
                </span>
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

            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#0B2545]">Matching Listings</h2>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {matchesCount} matches
                </span>
              </div>

              {matches.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  No matching listings found for current criteria.
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
