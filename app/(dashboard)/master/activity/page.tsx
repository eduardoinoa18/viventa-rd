'use client'

import { useEffect, useMemo, useState } from 'react'
import { FiActivity, FiRefreshCw, FiSearch } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface ActivityItem {
  id: string
  type: string
  action: string
  userName?: string | null
  userEmail?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  entityType?: string | null
  entityId?: string | null
  timestamp?: string | null
  metadata?: Record<string, any>
}

export default function MasterActivityPage() {
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [typeFilter, setTypeFilter] = useState('all')
  const [actorFilter, setActorFilter] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [objectFilter, setObjectFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [search, setSearch] = useState('')

  async function loadActivity() {
    try {
      setLoading(true)
      const query = new URLSearchParams()
      query.set('limit', '200')
      if (typeFilter !== 'all') query.set('type', typeFilter)
      if (actorFilter.trim()) query.set('actorEmail', actorFilter.trim())
      if (entityFilter.trim()) query.set('entityType', entityFilter.trim())
      if (objectFilter.trim()) query.set('objectId', objectFilter.trim())
      if (fromDate) query.set('from', fromDate)
      if (toDate) query.set('to', toDate)

      const res = await fetch(`/api/admin/activity?${query.toString()}`)
      const json = await res.json()
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Failed to load activity')

      setActivities(Array.isArray(json.data) ? json.data : [])
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to load activity logs')
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadActivity()
  }, [typeFilter, actorFilter, entityFilter, objectFilter, fromDate, toDate])

  async function exportCsv() {
    try {
      const query = new URLSearchParams()
      query.set('limit', '500')
      query.set('format', 'csv')
      if (typeFilter !== 'all') query.set('type', typeFilter)
      if (actorFilter.trim()) query.set('actorEmail', actorFilter.trim())
      if (entityFilter.trim()) query.set('entityType', entityFilter.trim())
      if (objectFilter.trim()) query.set('objectId', objectFilter.trim())
      if (fromDate) query.set('from', fromDate)
      if (toDate) query.set('to', toDate)

      const res = await fetch(`/api/admin/activity?${query.toString()}`)
      if (!res.ok) {
        throw new Error('Unable to export CSV')
      }

      const csvText = await res.text()
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'activity-log-export.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('CSV export generated')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Unable to export CSV')
    }
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return activities
    const q = search.trim().toLowerCase()
    return activities.filter((item) => {
      return (
        item.type?.toLowerCase().includes(q) ||
        item.action?.toLowerCase().includes(q) ||
        item.userName?.toLowerCase().includes(q) ||
        item.userEmail?.toLowerCase().includes(q) ||
        item.actorEmail?.toLowerCase().includes(q) ||
        item.entityType?.toLowerCase().includes(q) ||
        item.entityId?.toLowerCase().includes(q)
      )
    })
  }, [activities, search])

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545] flex items-center gap-3">
              <FiActivity /> Activity Log
            </h1>
            <p className="text-gray-600 mt-1">Immutable audit trail for admin operations</p>
          </div>
          <div className="inline-flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={loadActivity}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 text-sm"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <FiSearch className="text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by action, actor, user, entity..."
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[280px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter activity type"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="user">User</option>
              <option value="application">Application</option>
              <option value="property">Property</option>
              <option value="auth">Auth</option>
              <option value="system">System</option>
              <option value="billing">Billing</option>
            </select>

            <input
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="Actor email"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              aria-label="Filter by actor email"
            />

            <input
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              placeholder="Entity type"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              aria-label="Filter by entity type"
            />

            <input
              value={objectFilter}
              onChange={(e) => setObjectFilter(e.target.value)}
              placeholder="Object ID"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              aria-label="Filter by object id"
            />

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              aria-label="Filter activity from date"
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              aria-label="Filter activity to date"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left p-3">Timestamp</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Action</th>
                  <th className="text-left p-3">Actor</th>
                  <th className="text-left p-3">User</th>
                  <th className="text-left p-3">Entity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={6} className="p-5 text-center text-gray-500">Loading activity logs...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="p-5 text-center text-gray-500">No activity found</td></tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="p-3 text-xs text-gray-600">{item.timestamp ? new Date(item.timestamp).toLocaleString('es-DO') : '—'}</td>
                      <td className="p-3"><span className="px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold">{item.type}</span></td>
                      <td className="p-3 font-medium text-[#0B2545]">{item.action}</td>
                      <td className="p-3 text-xs text-gray-700">
                        <div>{item.actorEmail || 'system'}</div>
                        <div className="text-gray-500">{item.actorRole || '—'}</div>
                      </td>
                      <td className="p-3 text-xs text-gray-700">
                        <div>{item.userName || '—'}</div>
                        <div className="text-gray-500">{item.userEmail || '—'}</div>
                      </td>
                      <td className="p-3 text-xs text-gray-700">
                        <div>{item.entityType || '—'}</div>
                        <div className="text-gray-500 font-mono">{item.entityId || '—'}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
