// app/admin/activity/page.tsx
'use client'
import { useEffect, useState } from 'react'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import ProtectedClient from '../../auth/ProtectedClient'
import { FiActivity, FiUser, FiFileText, FiHome, FiServer, FiClock, FiCheckCircle, FiXCircle, FiRefreshCw, FiDownload } from 'react-icons/fi'

type ActivityLog = {
  id: string
  type: 'user' | 'application' | 'property' | 'system' | 'auth' | 'billing'
  action: string
  userId?: string
  userName?: string
  userEmail?: string
  metadata?: Record<string, any>
  timestamp: string
}

export default function AdminActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [limit, setLimit] = useState(50)

  useEffect(() => {
    loadLogs()
  }, [limit])

  async function loadLogs() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/activity?limit=${limit}`)
      const json = await res.json()
      if (json.ok) {
        setLogs(json.data || [])
      }
    } catch (e) {
      console.error('Failed to load activity logs', e)
    } finally {
      setLoading(false)
    }
  }

  function exportToCSV() {
    const headers = ['Timestamp', 'Type', 'Action', 'User Name', 'User Email', 'Metadata']
    const rows = filtered.map(log => [
      new Date(log.timestamp).toLocaleString('es-DO'),
      log.type,
      log.action,
      log.userName || '-',
      log.userEmail || '-',
      JSON.stringify(log.metadata || {})
    ])

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `activity_logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const filtered = logs.filter(log => filter === 'all' || log.type === filter)

  function getIcon(type: string) {
    switch (type) {
      case 'user': return <FiUser className="text-blue-600" />
      case 'application': return <FiFileText className="text-purple-600" />
      case 'property': return <FiHome className="text-green-600" />
      case 'auth': return <FiCheckCircle className="text-indigo-600" />
      case 'system': return <FiServer className="text-gray-600" />
      default: return <FiActivity className="text-gray-600" />
    }
  }

  function getActionBadge(action: string) {
    const colors: Record<string, string> = {
      created: 'bg-green-100 text-green-800',
      updated: 'bg-blue-100 text-blue-800',
      approved: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-red-100 text-red-800',
      deleted: 'bg-gray-100 text-gray-800',
      login: 'bg-indigo-100 text-indigo-800',
      sync: 'bg-purple-100 text-purple-800',
      upload: 'bg-amber-100 text-amber-800',
    }
    return colors[action] || 'bg-gray-100 text-gray-800'
  }

  function formatTimestamp(ts: string) {
    try {
      const date = new Date(ts)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Justo ahora'
      if (diffMins < 60) return `Hace ${diffMins} min`
      if (diffHours < 24) return `Hace ${diffHours}h`
      if (diffDays < 7) return `Hace ${diffDays}d`
      return date.toLocaleDateString('es-DO')
    } catch {
      return ts
    }
  }

  return (
    <ProtectedClient allowed={['master_admin', 'admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-[#0B2545] inline-flex items-center gap-2">
                  <FiActivity /> Activity Feed
                </h1>
                <p className="text-gray-600 text-sm mt-1">Monitor system events and user actions</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportToCSV}
                  disabled={filtered.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B2545] text-white rounded-lg font-semibold hover:bg-[#0a1f3a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiDownload /> Export CSV
                </button>
                <button
                  onClick={loadLogs}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64]"
                >
                  <FiRefreshCw /> Refresh
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex gap-2 flex-wrap">
              {['all', 'user', 'application', 'property', 'auth', 'system'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === f
                      ? 'bg-[#00A676] text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border'
                  }`}
                >
                  {f === 'all' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
                  <span className="ml-2 text-xs opacity-70">
                    ({logs.filter(l => f === 'all' || l.type === f).length})
                  </span>
                </button>
              ))}
            </div>

            {/* Activity Timeline */}
            {loading ? (
              <div className="text-center py-12 text-gray-500">Cargando actividad...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <FiActivity className="mx-auto text-4xl text-gray-300 mb-3" />
                <p className="text-gray-500">No hay actividad registrada</p>
              </div>
            ) : (
              <>
                {/* Stats Bar */}
                <div className="mb-4 flex items-center justify-between text-sm text-gray-600 px-2">
                  <span>
                    Mostrando <strong>{filtered.length}</strong> de <strong>{logs.length}</strong> actividades
                  </span>
                  <div className="flex items-center gap-2">
                    <label htmlFor="limit-select" className="text-sm font-medium">
                      Mostrar:
                    </label>
                    <select
                      id="limit-select"
                      value={limit}
                      onChange={(e) => setLimit(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={500}>500</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  {filtered.map(log => (
                    <div key={log.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-50 rounded-full">
                          {getIcon(log.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getActionBadge(log.action)}`}>
                              {log.action}
                            </span>
                            <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                              <FiClock size={12} /> {formatTimestamp(log.timestamp)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 font-medium">
                            {log.userName || log.userEmail || 'Sistema'}
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                              {log.metadata.role && <span className="mr-3">Rol: <strong>{log.metadata.role}</strong></span>}
                              {log.metadata.type && <span className="mr-3">Tipo: <strong>{log.metadata.type}</strong></span>}
                              {log.metadata.code && <span className="mr-3">Código: <strong className="font-mono text-[#00A676]">{log.metadata.code}</strong></span>}
                              {log.metadata.title && <span className="mr-3">Título: <strong>{log.metadata.title}</strong></span>}
                              {log.metadata.created !== undefined && <span className="mr-3">Creados: <strong>{log.metadata.created}</strong></span>}
                              {log.metadata.updated !== undefined && <span className="mr-3">Actualizados: <strong>{log.metadata.updated}</strong></span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {logs.length >= limit && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setLimit(limit + 50)}
                      className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Cargar más actividades
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
