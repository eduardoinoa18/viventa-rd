'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiFilter, FiSearch, FiUsers } from 'react-icons/fi'

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
  createdAt?: string
}

function formatRelativeDate(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return '—'
  const diff = date.getTime() - Date.now()
  const minutes = Math.round(diff / (1000 * 60))
  if (Math.abs(minutes) < 60) return `${Math.abs(minutes)}m ${minutes >= 0 ? 'left' : 'ago'}`
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return `${Math.abs(hours)}h ${hours >= 0 ? 'left' : 'ago'}`
  const days = Math.round(hours / 24)
  return `${Math.abs(days)}d ${days >= 0 ? 'left' : 'ago'}`
}

export default function MasterBuyersPage() {
  const [buyers, setBuyers] = useState<BuyerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [purposeFilter, setPurposeFilter] = useState('')

  const fetchBuyers = useCallback(async () => {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      if (locationFilter.trim()) query.set('location', locationFilter.trim())
      if (purposeFilter.trim()) query.set('purpose', purposeFilter.trim())
      query.set('limit', '200')

      const url = `/api/crm/buyers?${query.toString()}`
      const res = await fetch(url)
      const data = await res.json()

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Failed to load buyers')
      }

      setBuyers(Array.isArray(data.data) ? data.data : [])
    } catch (error) {
      console.error('buyers fetch error', error)
      toast.error('No se pudieron cargar los compradores')
    } finally {
      setLoading(false)
    }
  }, [locationFilter, purposeFilter])

  useEffect(() => {
    fetchBuyers()
  }, [fetchBuyers])

  const filteredBuyers = useMemo(() => {
    if (!search.trim()) return buyers
    const term = search.trim().toLowerCase()
    return buyers.filter((buyer) => {
      return (
        buyer.name?.toLowerCase().includes(term) ||
        buyer.email?.toLowerCase().includes(term) ||
        buyer.phone?.toLowerCase().includes(term)
      )
    })
  }, [buyers, search])

  const purposeOptions = Array.from(
    new Set(
      buyers
        .map((buyer) => buyer.criteria?.purpose)
        .filter((purpose): purpose is string => Boolean(purpose))
    )
  ).sort()

  const locationOptions = Array.from(
    new Set(
      buyers
        .map((buyer) => buyer.criteria?.location)
        .filter((location): location is string => Boolean(location))
    )
  ).sort()

  return (
    <main className="flex-1 p-6 bg-gray-50">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-blue-50 p-2 text-blue-700">
              <FiUsers />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-[#0B2545]">Buyers</h1>
              <p className="text-sm text-gray-600">Manage buyer profiles and criteria.</p>
            </div>
          </div>
          <button
            onClick={fetchBuyers}
            className="px-4 py-2 text-sm font-medium text-[#0B2545] border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Total Buyers</div>
            <div className="text-2xl font-bold text-[#0B2545]">{buyers.length}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">With Criteria</div>
            <div className="text-2xl font-bold text-[#0B2545]">
              {buyers.filter((buyer) => buyer.criteria && Object.keys(buyer.criteria).length > 0).length}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Active Filters</div>
            <div className="text-2xl font-bold text-[#0B2545]">
              {[locationFilter, purposeFilter, search].filter((value) => value.trim()).length}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">High Priority</div>
            <div className="text-2xl font-bold text-red-700">
              {buyers.filter((buyer) => buyer.priority === 'high').length}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Follow-up Due</div>
            <div className="text-2xl font-bold text-amber-600">
              {buyers.filter((buyer) => buyer.nextFollowUpAt && new Date(buyer.nextFollowUpAt).getTime() <= Date.now()).length}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#0B2545]">
              <FiFilter /> Filters
            </div>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
                <FiSearch className="text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, email, or phone"
                  className="w-full border-0 bg-transparent p-0 text-sm focus:outline-none"
                  aria-label="Search buyers"
                />
              </label>
              <select
                value={locationFilter}
                onChange={(event) => setLocationFilter(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                aria-label="Filter buyers by location"
              >
                <option value="">All locations</option>
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
              <select
                value={purposeFilter}
                onChange={(event) => setPurposeFilter(event.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                aria-label="Filter buyers by purpose"
              >
                <option value="">All purposes</option>
                {purposeOptions.map((purpose) => (
                  <option key={purpose} value={purpose}>
                    {purpose}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-3 text-left">Buyer</th>
                  <th className="px-5 py-3 text-left">Contact</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-left">Budget</th>
                  <th className="px-5 py-3 text-left">Lifecycle</th>
                  <th className="px-5 py-3 text-left">Engagement</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                      Loading buyers...
                    </td>
                  </tr>
                ) : filteredBuyers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                      No buyers found.
                    </td>
                  </tr>
                ) : (
                  filteredBuyers.map((buyer) => (
                    <tr key={buyer.id} className="hover:bg-gray-50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-[#0B2545]">{buyer.name}</div>
                        <div className="text-xs text-gray-500">{buyer.status || 'active'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-gray-700">{buyer.email}</div>
                        {buyer.phone && <div className="text-xs text-gray-500">{buyer.phone}</div>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-gray-700">{buyer.criteria?.location || '—'}</div>
                        {buyer.criteria?.projectOnly && (
                          <div className="text-xs text-blue-600">Project only</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {buyer.criteria?.budgetMin || buyer.criteria?.budgetMax ? (
                          <div className="text-gray-700">
                            {buyer.criteria?.budgetMin ? `$${buyer.criteria?.budgetMin.toLocaleString()}` : '—'}
                            {' - '}
                            {buyer.criteria?.budgetMax ? `$${buyer.criteria?.budgetMax.toLocaleString()}` : '—'}
                          </div>
                        ) : (
                          <div className="text-gray-400">—</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <span className="inline-flex w-fit rounded-full bg-blue-50 px-2 py-1 text-blue-700 capitalize">
                            {buyer.lifecycleStage || 'new'}
                          </span>
                          <span className={`inline-flex w-fit rounded-full px-2 py-1 capitalize ${buyer.priority === 'high' ? 'bg-red-100 text-red-700' : buyer.priority === 'low' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'}`}>
                            {buyer.priority || 'medium'} priority
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1 text-xs text-gray-600">
                          <div>Score: <span className="font-semibold text-[#0B2545]">{buyer.engagementScore ?? 50}</span>/100</div>
                          <div>Owner: {buyer.assignedAgentName || 'Unassigned'}</div>
                          <div>Next: {formatRelativeDate(buyer.nextFollowUpAt)}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/master/buyers/${buyer.id}`}
                          className="inline-flex rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-[#0B2545] hover:bg-gray-100"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
