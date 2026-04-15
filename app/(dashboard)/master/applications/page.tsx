'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { FiCheck, FiX, FiFilter, FiSearch, FiClock, FiAlertCircle, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { mapOfficeQuotaIssue } from '@/lib/quotaUiMessages'

interface Application {
  id: string
  entityId?: string
  source?: 'application' | 'subscription_request'
  contact: string
  email: string
  phone: string
  type: 'agent' | 'broker' | 'new-agent' | 'constructora'
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
  reviewScore?: number
  reviewRecommendation?: 'approve' | 'manual_review' | 'decline'
  rejectionReasonCode?: string | null
  failedRequirements?: string[]
  reviewCriteria?: Partial<ReviewCriteria>
  notes?: string
  contactPerson?: string
  planId?: string
  userId?: string | null
  createdBy?: string
}

type ReviewCriteria = {
  identityVerified: boolean
  businessProfileValid: boolean
  documentationComplete: boolean
  readinessSignal: boolean
}

type RejectionReasonCode =
  | 'kyc_failed'
  | 'missing_required_documents'
  | 'license_or_registration_invalid'
  | 'market_fit_insufficient'
  | 'compliance_risk_high'
  | 'other'

const HARD_REQUIREMENT_OPTIONS = [
  { key: 'identity', label: 'Validacion de identidad/KYC' },
  { key: 'license', label: 'Licencia o registro valido' },
  { key: 'documents', label: 'Documentos legales requeridos' },
  { key: 'compliance', label: 'Umbral de riesgo de cumplimiento' },
] as const

export default function ApplicationsPage() {
  const [sessionRole, setSessionRole] = useState<string>('')
  const [authResolved, setAuthResolved] = useState(false)
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewQuotaIssue, setReviewQuotaIssue] = useState<{ message: string; ctaHref?: string; ctaLabel?: string } | null>(null)
  const [rejectionReason, setRejectionReason] = useState<RejectionReasonCode | ''>('')
  const [failedRequirements, setFailedRequirements] = useState<string[]>([])
  const [reviewCriteria, setReviewCriteria] = useState<ReviewCriteria>({
    identityVerified: false,
    businessProfileValid: false,
    documentationComplete: false,
    readinessSignal: false,
  })

  const reviewScore = useMemo(() => {
    const passed = Object.values(reviewCriteria).filter(Boolean).length
    return Math.round((passed / 4) * 100)
  }, [reviewCriteria])

  const reviewRecommendation = useMemo<'approve' | 'manual_review' | 'decline'>(() => {
    if (reviewScore >= 75) return 'approve'
    if (reviewScore >= 50) return 'manual_review'
    return 'decline'
  }, [reviewScore])

  const hasActiveFilters = statusFilter !== 'all' || typeFilter !== 'all' || searchQuery.trim().length > 0

  // Filtered applications
  const filteredApplications = useMemo(() => {
    let filtered = applications

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((app) => app.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((app) => app.type === typeFilter)
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
  }, [applications, statusFilter, typeFilter, searchQuery])

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
    const bootstrap = async () => {
      try {
        const sessionRes = await fetch('/api/auth/session', { cache: 'no-store' })
        const sessionJson = await sessionRes.json().catch(() => ({}))
        const role = String(sessionJson?.session?.role || '')
        setSessionRole(role)
      } finally {
        setAuthResolved(true)
      }
    }

    bootstrap()
  }, [])

  useEffect(() => {
    if (!authResolved) return
    if (sessionRole !== 'master_admin' && sessionRole !== 'admin') {
      setLoading(false)
      return
    }
    loadApplications()
  }, [statusFilter, authResolved, sessionRole])

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

  function openReview(app: Application) {
    setSelectedApp(app)
    setReviewNotes(app.reviewNotes || app.notes || '')
    setRejectionReason('')
    setFailedRequirements([])
    setReviewCriteria({
      identityVerified: Boolean(app.reviewCriteria?.identityVerified),
      businessProfileValid: Boolean(app.reviewCriteria?.businessProfileValid),
      documentationComplete: Boolean(app.reviewCriteria?.documentationComplete),
      readinessSignal: Boolean(app.reviewCriteria?.readinessSignal),
    })
    setReviewQuotaIssue(null)
    setShowReviewModal(true)
  }

  function clearFilters() {
    setStatusFilter('all')
    setTypeFilter('all')
    setSearchQuery('')
  }

  function closeReview() {
    setShowReviewModal(false)
    setSelectedApp(null)
    setReviewNotes('')
    setRejectionReason('')
    setFailedRequirements([])
    setReviewQuotaIssue(null)
  }

  function toggleFailedRequirement(key: string) {
    setFailedRequirements((prev) => (prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key]))
  }

  async function submitReviewDecision(status: 'approved' | 'rejected' | 'more_info') {
    if (!selectedApp) return

    if (!selectedApp.email || !selectedApp.contact) {
      toast.error('Faltan datos requeridos de la solicitud')
      return
    }

    if (status === 'approved' && reviewScore < 75) {
      toast.error('Aprobacion requiere puntaje minimo de 75 (3 de 4 criterios).')
      return
    }

    if (status === 'rejected' && reviewNotes.trim().length < 10) {
      toast.error('Provee una razon de rechazo clara (minimo 10 caracteres).')
      return
    }

    if (status === 'rejected' && !rejectionReason) {
      toast.error('Selecciona una razon estructurada de rechazo.')
      return
    }

    if (status === 'rejected' && failedRequirements.length === 0) {
      toast.error('Selecciona al menos un requisito que haya fallado.')
      return
    }

    setProcessingId(selectedApp.id)
    setReviewQuotaIssue(null)
    try {
      const endpoint = selectedApp.source === 'subscription_request'
        ? '/api/admin/revenue/subscription-requests'
        : '/api/admin/applications'

      const body = selectedApp.source === 'subscription_request'
        ? {
            id: selectedApp.entityId || selectedApp.id,
            status,
          }
        : {
            id: selectedApp.entityId || selectedApp.id,
            status,
            notes: reviewNotes?.trim() || undefined,
            email: selectedApp.email,
            name: selectedApp.contact,
            type: selectedApp.type,
            phone: selectedApp.phone,
            company: selectedApp.company,
            criteriaChecks: reviewCriteria,
            criteriaScore: reviewScore,
            rejectionReason,
            failedRequirements,
          }

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const json = await res.json()
      
      if (res.ok && json.ok) {
        if (status === 'approved') {
          toast.success(`${selectedApp.contact} aprobado. Credenciales enviadas por email.`)
        } else if (status === 'rejected') {
          toast.success(`${selectedApp.contact} rechazado`)
        } else {
          toast.success('Solicitud de mas informacion enviada')
        }
        closeReview()
        loadApplications()
      } else {
        const issue = mapOfficeQuotaIssue(json || {}, {
          context: 'agent-seat',
            fallbackMessage: 'No se pudo actualizar la revision',
        })
        toast.error(issue.message)
        setReviewQuotaIssue(issue)
      }
    } catch (e) {
      console.error('Failed to update application review', e)
      toast.error('No se pudo actualizar la revision')
    } finally {
      setProcessingId(null)
    }
  }

  // Handle delete application
  async function handleDelete(app: Application) {
    if (!confirm(`Eliminar solicitud de ${app.contact}? Esta accion no se puede deshacer.`)) return

    setProcessingId(app.id)
    try {
      const endpoint = app.source === 'subscription_request'
        ? '/api/admin/revenue/subscription-requests'
        : '/api/admin/applications'

      const res = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: app.entityId || app.id }),
      })

      const json = await res.json()
      
      if (res.ok && json.ok) {
        toast.success('Solicitud eliminada')
        loadApplications()
      } else {
        toast.error(json.error || 'No se pudo eliminar la solicitud')
      }
    } catch (e) {
      console.error('Failed to delete application', e)
      toast.error('No se pudo eliminar la solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      agent: '🏢 Agente',
      'new-agent': '🌱 Agente Nuevo',
      broker: '🏛️ Brokerage',
      constructora: '🏗️ Constructora',
    }
    return labels[type] || type
  }

  const getSourceBadge = (source?: string) => {
    if (source === 'subscription_request') {
      return { className: 'bg-indigo-100 text-indigo-800', label: 'Suscripcion' }
    }
    return { className: 'bg-slate-100 text-slate-700', label: 'Solicitud Directa' }
  }

  const getReviewBadge = (score?: number) => {
    const safe = typeof score === 'number' ? score : 0
    if (safe >= 75) return 'bg-emerald-100 text-emerald-800'
    if (safe >= 50) return 'bg-amber-100 text-amber-800'
    return 'bg-rose-100 text-rose-800'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      more_info: 'bg-blue-100 text-blue-800',
    }
    const labels: Record<string, string> = {
      pending: 'Pendiente',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      more_info: 'Mas Informacion',
    }
    return { style: styles[status] || 'bg-gray-100 text-gray-800', label: labels[status] || status }
  }

  const formatDate = (date: any) => {
    if (!date) return '—'
    const d = new Date(date)
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isPendingSelection = selectedApp?.status === 'pending'

  const isAdminReviewer = sessionRole === 'master_admin' || sessionRole === 'admin'

  if (authResolved && !isAdminReviewer) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-2xl font-bold text-amber-900">Las solicitudes son solo para administradores</h1>
            <p className="mt-2 text-sm text-amber-800">
              Los roles broker/agente/constructora siguen el flujo del dashboard operativo. La revision de solicitudes es exclusiva de los administradores.
            </p>
            <div className="mt-4 flex gap-2">
              <Link href="/dashboard" className="px-4 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium hover:bg-[#12355f]">Ir al Dashboard</Link>
              <Link href="/master/leads" className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">Ir a Leads</Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Solicitudes Profesionales</h1>
          <p className="text-gray-600">Revisa y gestiona solicitudes de agentes, brokers y constructoras con criterios estructurados</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Link href="/master/leads" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Leads</Link>
          <Link href="/master/listings" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Propiedades</Link>
          <Link href="/master/users" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Personas</Link>
          <Link href="/master/inbox" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Mensajes</Link>
          <Link href="/master/settings" className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">Configuracion</Link>
        </div>

        <div className="mb-6 rounded-lg border border-[#0B2545]/20 bg-[#0B2545]/5 p-4">
          <div className="text-sm font-semibold text-[#0B2545]">Guia de Revision de Solicitudes</div>
          <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-700 md:grid-cols-3">
            <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2"><span className="font-semibold">Agente:</span> verifica identidad, experiencia y disposicion; luego asigna oficina.</div>
            <div className="rounded border border-purple-200 bg-purple-50 px-3 py-2"><span className="font-semibold">Broker:</span> verifica perfil legal, cumplimiento y estructura operativa antes de activar.</div>
            <div className="rounded border border-orange-200 bg-orange-50 px-3 py-2"><span className="font-semibold">Constructora:</span> verifica documentos, disposicion de proyectos y gobernanza de publicacion.</div>
          </div>
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
              Pendiente
            </div>
            <div className="text-3xl font-bold text-yellow-900">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4 cursor-pointer hover:border-green-300" onClick={() => setStatusFilter('approved')}>
            <div className="text-sm font-medium text-green-700 flex items-center gap-2">
              <FiCheck className="w-4 h-4" />
              Aprobado
            </div>
            <div className="text-3xl font-bold text-green-900">{stats.approved}</div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4 cursor-pointer hover:border-red-300" onClick={() => setStatusFilter('rejected')}>
            <div className="text-sm font-medium text-red-700 flex items-center gap-2">
              <FiX className="w-4 h-4" />
              Rechazado
            </div>
            <div className="text-3xl font-bold text-red-900">{stats.rejected}</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4 cursor-pointer hover:border-blue-300" onClick={() => setStatusFilter('more_info')}>
            <div className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4" />
              Mas Info
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
                placeholder="Buscar por nombre, email, telefono o empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFilter className="w-5 h-5 text-gray-400" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by applicant type"
              >
                <option value="all">Todos los tipos</option>
                <option value="agent">Agente</option>
                <option value="new-agent">Agente Nuevo</option>
                <option value="broker">Broker</option>
                <option value="constructora">Constructora</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filtrar por estado"
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
                <option value="more_info">Mas Info</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Filtros activos</span>
              {statusFilter !== 'all' && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">Estado: {statusFilter.replace('_', ' ')}</span>}
              {typeFilter !== 'all' && <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">Tipo: {typeFilter}</span>}
              {searchQuery.trim() && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">Busqueda: "{searchQuery.trim()}"</span>}
              <button
                onClick={clearFilters}
                className="ml-auto inline-flex items-center rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                title="Clear all filters"
              >
                Limpiar
              </button>
            </div>
          )}
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
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Solicitante</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Empresa</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Criterios</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
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
                          <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getSourceBadge(app.source).className}`}>
                            {getSourceBadge(app.source).label}
                          </span>
                          {app.pathway === 'new_agent_program' && (
                            <span className="block text-xs text-blue-600">Programa Agente Nuevo</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {app.company && <p className="font-medium text-gray-900">{app.company}</p>}
                            {app.markets && <p className="text-gray-600 truncate">{app.markets}</p>}
                            {app.years && <p className="text-gray-500">{app.years}+ yrs exp</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getReviewBadge(app.reviewScore)}`}>
                              Score: {typeof app.reviewScore === 'number' ? app.reviewScore : 0}
                            </span>
                            {app.reviewRecommendation && (
                              <p className="mt-1 text-xs text-gray-500">Recomendacion: {app.reviewRecommendation.replace('_', ' ')}</p>
                            )}
                            {app.rejectionReasonCode && (
                              <p className="mt-1 text-xs text-rose-700">Razon: {app.rejectionReasonCode.replace(/_/g, ' ')}</p>
                            )}
                            {Array.isArray(app.failedRequirements) && app.failedRequirements.length > 0 && (
                              <p className="mt-1 text-xs text-rose-600">Fallidos: {app.failedRequirements.join(', ')}</p>
                            )}
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
                            <button
                              onClick={() => openReview(app)}
                              disabled={processingId === app.id}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-slate-700 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                              <FiAlertCircle className="w-4 h-4" />
                              {isPending ? 'Revisar' : 'Ver'}
                            </button>
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

      {/* Review Modal */}
      {showReviewModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Revisar Solicitud</h3>
            <p className="text-gray-600 mb-4">
              Revisando <strong>{selectedApp.contact}</strong> ({getTypeLabel(selectedApp.type)})
            </p>

            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Informacion Enviada</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p><span className="text-gray-500">Fuente:</span> <span className="font-medium text-gray-900">{getSourceBadge(selectedApp.source).label}</span></p>
                <p><span className="text-gray-500">Estado:</span> <span className="font-medium text-gray-900">{selectedApp.status}</span></p>
                <p><span className="text-gray-500">Nombre:</span> <span className="font-medium text-gray-900">{selectedApp.contact || '—'}</span></p>
                <p><span className="text-gray-500">Email:</span> <span className="font-medium text-gray-900">{selectedApp.email || '—'}</span></p>
                <p><span className="text-gray-500">Telefono:</span> <span className="font-medium text-gray-900">{selectedApp.phone || '—'}</span></p>
                <p><span className="text-gray-500">Tipo:</span> <span className="font-medium text-gray-900">{getTypeLabel(selectedApp.type)}</span></p>
                <p><span className="text-gray-500">Empresa:</span> <span className="font-medium text-gray-900">{selectedApp.company || '—'}</span></p>
                <p><span className="text-gray-500">Contacto:</span> <span className="font-medium text-gray-900">{selectedApp.contactPerson || '—'}</span></p>
                <p><span className="text-gray-500">Anos exp.:</span> <span className="font-medium text-gray-900">{selectedApp.years ?? '—'}</span></p>
                <p><span className="text-gray-500">Mercados:</span> <span className="font-medium text-gray-900">{selectedApp.markets || '—'}</span></p>
                <p><span className="text-gray-500">Volume 12m:</span> <span className="font-medium text-gray-900">{selectedApp.volume12m ?? '—'}</span></p>
                <p><span className="text-gray-500">Sitio Web:</span> {selectedApp.website ? <a className="font-medium text-blue-700 hover:underline" href={selectedApp.website} target="_blank" rel="noreferrer">Abrir</a> : <span className="font-medium text-gray-900">—</span>}</p>
                <p><span className="text-gray-500">Plan ID:</span> <span className="font-medium text-gray-900">{selectedApp.planId || '—'}</span></p>
                <p><span className="text-gray-500">Usuario:</span> <span className="font-medium text-gray-900">{selectedApp.userId || '—'}</span></p>
                <p><span className="text-gray-500">Enviado:</span> <span className="font-medium text-gray-900">{formatDate(selectedApp.createdAt)}</span></p>
                <p><span className="text-gray-500">Aprobado:</span> <span className="font-medium text-gray-900">{formatDate(selectedApp.approvedAt)}</span></p>
                <p><span className="text-gray-500">Curriculum:</span> {selectedApp.resumeUrl ? <a className="font-medium text-blue-700 hover:underline" href={selectedApp.resumeUrl} target="_blank" rel="noreferrer">Abrir archivo</a> : <span className="font-medium text-gray-900">—</span>}</p>
                <p><span className="text-gray-500">Documento:</span> {selectedApp.documentUrl ? <a className="font-medium text-blue-700 hover:underline" href={selectedApp.documentUrl} target="_blank" rel="noreferrer">Abrir archivo</a> : <span className="font-medium text-gray-900">—</span>}</p>
              </div>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-600">Ver datos completos de la solicitud</summary>
                <pre className="mt-2 p-3 bg-white border border-gray-200 rounded text-[11px] text-gray-700 overflow-auto">{JSON.stringify(selectedApp, null, 2)}</pre>
              </details>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={reviewCriteria.identityVerified}
                  disabled={!isPendingSelection}
                  onChange={(e) => setReviewCriteria(prev => ({ ...prev, identityVerified: e.target.checked }))}
                />
                Identidad y contacto verificados
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={reviewCriteria.businessProfileValid}
                  disabled={!isPendingSelection}
                  onChange={(e) => setReviewCriteria(prev => ({ ...prev, businessProfileValid: e.target.checked }))}
                />
                Perfil de negocio y mercado validos
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={reviewCriteria.documentationComplete}
                  disabled={!isPendingSelection}
                  onChange={(e) => setReviewCriteria(prev => ({ ...prev, documentationComplete: e.target.checked }))}
                />
                Documentacion completa
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={reviewCriteria.readinessSignal}
                  disabled={!isPendingSelection}
                  onChange={(e) => setReviewCriteria(prev => ({ ...prev, readinessSignal: e.target.checked }))}
                />
                Disposicion operacional confirmada
              </label>
            </div>

            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm text-gray-700">
                Puntaje: <strong>{reviewScore}</strong> • Recomendacion: <strong>{reviewRecommendation.replace('_', ' ')}</strong>
              </p>
            </div>

            {reviewQuotaIssue ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p>{reviewQuotaIssue.message}</p>
                {reviewQuotaIssue.ctaHref && reviewQuotaIssue.ctaLabel ? (
                  <div className="mt-1">
                    <Link href={reviewQuotaIssue.ctaHref} className="font-medium text-red-800 underline">
                      {reviewQuotaIssue.ctaLabel}
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : null}

            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Notas del revisor (requeridas para rechazo, opcional en otros casos)..."
              rows={4}
              disabled={!isPendingSelection}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <p className="text-xs text-gray-500 mt-2">Estas notas y criterios se guardan en el registro de revision.</p>

            <div className="mt-4 rounded-lg border border-gray-200 p-3">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Razon de rechazo estructurada (requerida para rechazar)</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value as RejectionReasonCode | '')}
                disabled={!isPendingSelection}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                aria-label="Structured rejection reason"
              >
                <option value="">Selecciona una razon</option>
                <option value="kyc_failed">KYC/identidad fallida</option>
                <option value="missing_required_documents">Documentos requeridos faltantes</option>
                <option value="license_or_registration_invalid">Licencia/registro invalido</option>
                <option value="market_fit_insufficient">Mercado insuficiente</option>
                <option value="compliance_risk_high">Riesgo de cumplimiento muy alto</option>
                <option value="other">Otro</option>
              </select>

              <p className="mt-3 text-sm font-semibold text-gray-700">Requisitos obligatorios fallidos</p>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {HARD_REQUIREMENT_OPTIONS.map((option) => (
                  <label key={option.key} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={failedRequirements.includes(option.key)}
                      disabled={!isPendingSelection}
                      onChange={() => toggleFailedRequirement(option.key)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-6 justify-end">
              <button
                onClick={closeReview}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              {isPendingSelection && (
                <>
                  <button
                    onClick={() => submitReviewDecision('more_info')}
                    disabled={processingId === selectedApp.id}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {processingId === selectedApp.id ? 'Procesando...' : 'Pedir Mas Info'}
                  </button>
                  <button
                    onClick={() => submitReviewDecision('rejected')}
                    disabled={processingId === selectedApp.id}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {processingId === selectedApp.id ? 'Rechazando...' : 'Rechazar'}
                  </button>
                  <button
                    onClick={() => submitReviewDecision('approved')}
                    disabled={processingId === selectedApp.id || reviewScore < 75}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
                  >
                    {processingId === selectedApp.id ? 'Aprobando...' : 'Aprobar'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
