'use client'

import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiCheck, FiClock, FiSearch, FiTrash2, FiX } from 'react-icons/fi'

type ReviewStatus = 'pending' | 'published' | 'rejected'

type AdminReview = {
  id: string
  professionalId: string
  professionalName: string
  professionalRole: string
  authorName: string
  rating: number
  comment: string
  status: ReviewStatus
  createdAt: string
  reviewedBy?: string
  reviewedAt?: string
  moderationNotes?: string
}

export default function MasterReviewsPage() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = reviews
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      list = list.filter((review) =>
        review.authorName?.toLowerCase().includes(query) ||
        review.professionalName?.toLowerCase().includes(query) ||
        review.comment?.toLowerCase().includes(query)
      )
    }
    return list.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
  }, [reviews, searchQuery])

  const stats = useMemo(() => ({
    total: reviews.length,
    pending: reviews.filter((review) => review.status === 'pending').length,
    published: reviews.filter((review) => review.status === 'published').length,
    rejected: reviews.filter((review) => review.status === 'rejected').length,
  }), [reviews])

  async function loadReviews() {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      query.set('status', statusFilter)
      query.set('limit', '300')

      const res = await fetch(`/api/admin/reviews?${query.toString()}`)
      const json = await res.json()
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudieron cargar las reseñas')
      }

      setReviews(Array.isArray(json.data) ? json.data : [])
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'No se pudieron cargar las reseñas')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [statusFilter])

  async function updateStatus(review: AdminReview, nextStatus: ReviewStatus) {
    setProcessingId(review.id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id, status: nextStatus }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo actualizar la reseña')
      }

      toast.success(`Reseña ${nextStatus === 'published' ? 'publicada' : nextStatus === 'rejected' ? 'rechazada' : 'actualizada'}`)
      await loadReviews()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'No se pudo actualizar la reseña')
    } finally {
      setProcessingId(null)
    }
  }

  async function deleteReview(review: AdminReview) {
    if (!confirm(`Eliminar reseña de ${review.authorName}?`)) return

    setProcessingId(review.id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: review.id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo eliminar la reseña')
      }

      toast.success('Reseña eliminada')
      await loadReviews()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'No se pudo eliminar la reseña')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0B2545]">Review Moderation</h1>
            <p className="text-gray-600 mt-1">Aprueba o rechaza reseñas públicas de agentes, brokers y constructoras.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-2xl font-bold text-[#0B2545]">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Published</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.published}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Rejected</p>
            <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por autor, profesional o texto"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | ReviewStatus)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              aria-label="Filtrar reseñas por estado"
            >
              <option value="pending">Pendientes</option>
              <option value="published">Publicadas</option>
              <option value="rejected">Rechazadas</option>
              <option value="all">Todas</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3">Review</th>
                  <th className="text-left px-4 py-3">Professional</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Created</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center px-4 py-8 text-gray-500">Cargando reseñas...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center px-4 py-8 text-gray-500">No hay reseñas en este estado.</td>
                  </tr>
                ) : (
                  filtered.map((review) => {
                    const statusClass =
                      review.status === 'published'
                        ? 'bg-emerald-100 text-emerald-800'
                        : review.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'

                    return (
                      <tr key={review.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 align-top">
                          <p className="font-semibold text-gray-900">{review.authorName}</p>
                          <p className="text-xs text-yellow-600 mt-0.5">{'★'.repeat(Math.max(1, Math.min(5, Math.round(review.rating || 0))))}</p>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-2">{review.comment}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <p className="font-medium text-gray-900">{review.professionalName}</p>
                          <p className="text-xs text-gray-500">{review.professionalRole || 'professional'}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                            {review.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-gray-600">
                          {review.createdAt ? new Date(review.createdAt).toLocaleString('es-DO') : '—'}
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => updateStatus(review, 'published')}
                              disabled={processingId === review.id || review.status === 'published'}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium disabled:opacity-50"
                              title="Publicar"
                            >
                              <FiCheck /> Publicar
                            </button>
                            <button
                              onClick={() => updateStatus(review, 'rejected')}
                              disabled={processingId === review.id || review.status === 'rejected'}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 text-white rounded text-xs font-medium disabled:opacity-50"
                              title="Rechazar"
                            >
                              <FiX /> Rechazar
                            </button>
                            <button
                              onClick={() => updateStatus(review, 'pending')}
                              disabled={processingId === review.id || review.status === 'pending'}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-600 text-white rounded text-xs font-medium disabled:opacity-50"
                              title="Mover a pendiente"
                            >
                              <FiClock /> Pending
                            </button>
                            <button
                              onClick={() => deleteReview(review)}
                              disabled={processingId === review.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-rose-200 text-rose-700 rounded text-xs font-medium disabled:opacity-50"
                              title="Eliminar reseña"
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
