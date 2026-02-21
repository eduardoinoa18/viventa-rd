'use client'

import { useState, useEffect, useMemo } from 'react'
import { FiCheck, FiX, FiFilter, FiSearch, FiClock, FiAlertCircle, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface Application {
  id: string
  contact: string
  email: string
  phone: string
  type: 'agent' | 'broker' | 'new-agent'
  status: 'pending' | 'approved' | 'rejected' | 'more_info'
  createdAt: any
  company?: string
  years?: number
  volume12m?: number
  markets?: string
  website?: string
  resumeUrl?: string
  documentUrl?: string
  pathway?: 'new_agent_program' | 'experienced'
  approvedAt?: any
  reviewedBy?: string
  reviewNotes?: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)

  // Filtered applications
  const filteredApplications = useMemo(() => {
    let filtered = applications

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.contact?.toLowerCase().includes(query) ||
          app.email?.toLowerCase().includes(query) ||
          app.phone?.includes(query) ||
          app.company?.toLowerCase().includes(query)
      )
    }

    return filtered.sort((a, b) => {
      const aDate = new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt).getTime()
      const bDate = new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt).getTime()
      return bDate - aDate
    })
  }, [applications, statusFilter, searchQuery])

  // Stats
  const stats = useMemo(() => ({
    total: applications.length,
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
    moreInfo: applications.filter((a) => a.status === 'more_info').length,
  }), [applications])

  // Load applications
  useEffect(() => {
    loadApplications()
  }, [statusFilter])

  const getUiErrorMessage = (status?: number) => {
    if (status === 401) return 'Tu sesión expiró. Inicia sesión nuevamente para revisar solicitudes.'
    if (status === 403) return 'No tienes permisos para revisar solicitudes profesionales.'
    return 'No se pudieron cargar las solicitudes profesionales.'
  }

  async function loadApplications() {
    setLoading(true)
    setError(null)
    try {
      const url = statusFilter && statusFilter !== 'all' 
        ? `/api/admin/applications?status=${statusFilter}` 
        : '/api/admin/applications'
      
      const res = await fetch(url)
      const json = await res.json()
      if (!res.ok || !json.ok) {
        const message = json?.error || getUiErrorMessage(res.status)
        setError(message)
        toast.error(message)
        setApplications([])
        return
      }
      
      if (Array.isArray(json.data)) {
        // Normalize timestamps from Firestore
        const normalized = json.data.map((app: any) => ({
          ...app,
          createdAt: app.createdAt?.seconds ? new Date(app.createdAt.seconds * 1000) : app.createdAt,
          approvedAt: app.approvedAt?.seconds ? new Date(app.approvedAt.seconds * 1000) : app.approvedAt,
        }))
        setApplications(normalized)
      }
    } catch (e) {
      console.error('Failed to load applications', e)
      const message = getUiErrorMessage()
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  // Handle approve
  async function handleApprove(app: Application) {
    if (!app.email || !app.contact) {
      toast.error('Missing required application data')
      return
    }

    setProcessingId(app.id)
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: app.id,
          status: 'approved',
          email: app.email,
          name: app.contact,
          type: app.type,
          phone: app.phone,
          company: app.company,
        }),
      })

      const json = await res.json()
      
      if (res.ok && json.ok) {
        toast.success(`${app.contact} approved! Credentials email sent.`)
        loadApplications()
      } else {
        toast.error(json.error || 'Failed to approve application')
      }
    } catch (e) {
      console.error('Failed to approve application', e)
      toast.error('Failed to approve application')
    } finally {
      setProcessingId(null)
    }
  }

  // Handle reject
  async function handleReject() {
    if (!selectedApp) return

    setProcessingId(selectedApp.id)
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedApp.id,
          status: 'rejected',
          notes: reviewNotes,
          email: selectedApp.email,
          name: selectedApp.contact,
          type: selectedApp.type,
        }),
      })

      const json = await res.json()
      
      if (res.ok && json.ok) {
        toast.success(`${selectedApp.contact} rejected`)
        setShowRejectModal(false)
        setReviewNotes('')
        setSelectedApp(null)
        loadApplications()
      } else {
        toast.error(json.error || 'Failed to reject application')
      }
    } catch (e) {
      console.error('Failed to reject application', e)
      toast.error('Failed to reject application')
    } finally {
      setProcessingId(null)
    }
  }

  // Handle request more info
  async function handleMoreInfo(app: Application) {
    setProcessingId(app.id)
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: app.id,
          status: 'more_info',
          notes: 'We need additional information before we can proceed. Please review your email.',
        }),
      })

      const json = await res.json()
      
      if (res.ok && json.ok) {
        toast.success('Sent request for more info')
        loadApplications()
      } else {
        toast.error(json.error || 'Failed to send request')
      }
    } catch (e) {
      console.error('Failed to send request', e)
      toast.error('Failed to send request')
    } finally {
      setProcessingId(null)
    }
  }

  // Handle delete application
  async function handleDelete(app: Application) {
    if (!confirm(`Delete application from ${app.contact}? This cannot be undone.`)) return

    setProcessingId(app.id)
    try {
      const res = await fetch('/api/admin/applications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: app.id }),
      })

      const json = await res.json()
      
      if (res.ok && json.ok) {
        toast.success('Application deleted')
        loadApplications()
      } else {
        toast.error(json.error || 'Failed to delete application')
      }
    } catch (e) {
      console.error('Failed to delete application', e)
      toast.error('Failed to delete application')
    } finally {
      setProcessingId(null)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      agent: '🏢 Agent',
      'new-agent': '🌱 New Agent',
      broker: '🏛️ Brokerage',
    }
    return labels[type] || type
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      more_info: 'bg-blue-100 text-blue-800',
    }
    const labels: Record<string, string> = {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      more_info: 'More Info Needed',
    }
    return { style: styles[status] || 'bg-gray-100 text-gray-800', label: labels[status] || status }
  }

  const formatDate = (date: any) => {
    if (!date) return '—'
    const d = new Date(date)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Professional Applications</h1>
          <p className="text-gray-600">Review and manage agent and brokerage applications</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">Total</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-yellow-200 p-4 cursor-pointer hover:border-yellow-300" onClick={() => setStatusFilter('pending')}>
            <div className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <FiClock className="w-4 h-4" />
              Pending
            </div>
            <div className="text-3xl font-bold text-yellow-900">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 cursor-pointer hover:border-green-300" onClick={() => setStatusFilter('approved')}>
            <div className="text-sm font-medium text-green-700 flex items-center gap-2">
              <FiCheck className="w-4 h-4" />
              Approved
            </div>
            <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4 cursor-pointer hover:border-red-300" onClick={() => setStatusFilter('rejected')}>
            <div className="text-sm font-medium text-red-700 flex items-center gap-2">
              <FiX className="w-4 h-4" />
              Rejected
            </div>
            <div className="text-3xl font-bold text-red-900">{stats.rejected}</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4 cursor-pointer hover:border-blue-300" onClick={() => setStatusFilter('more_info')}>
            <div className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4" />
              Info Needed
            </div>
            <div className="text-3xl font-bold text-blue-900">{stats.moreInfo}</div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="more_info">More Info</option>
              </select>
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {error && !loading && (
            <div className="p-4 border-b border-red-100 bg-red-50 text-sm text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando solicitudes...</p>
              </div>
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <p className="text-gray-500 text-lg">No se encontraron solicitudes</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company/Market</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredApplications.map((app) => {
                    const statusBadge = getStatusBadge(app.status)
                    const isPending = app.status === 'pending'
                    
                    return (
                      <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">{app.contact}</p>
                            <p className="text-sm text-gray-600">{app.email}</p>
                            <p className="text-sm text-gray-500">{app.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-700">{getTypeLabel(app.type)}</span>
                          {app.pathway === 'new_agent_program' && (
                            <span className="block text-xs text-blue-600">New Agent Program</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {app.company && <p className="font-medium text-gray-900">{app.company}</p>}
                            {app.markets && <p className="text-gray-600 truncate">{app.markets}</p>}
                            {app.years && <p className="text-gray-500">{app.years}+ yrs exp</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(app.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.style}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApprove(app)}
                                  disabled={processingId === app.id}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                  <FiCheck className="w-4 h-4" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedApp(app)
                                    setShowRejectModal(true)
                                  }}
                                  disabled={processingId === app.id}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                  <FiX className="w-4 h-4" />
                                  Reject
                                </button>
                                <button
                                  onClick={() => handleMoreInfo(app)}
                                  disabled={processingId === app.id}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                                >
                                  <FiAlertCircle className="w-4 h-4" />
                                  Info
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(app)}
                              disabled={processingId === app.id}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                              title="Delete application"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">
              Rejecting application from <strong>{selectedApp.contact}</strong>
            </p>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">This will be sent to the applicant in their rejection email.</p>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setReviewNotes('')
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processingId === selectedApp.id}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {processingId === selectedApp.id ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
