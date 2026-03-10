'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { uploadFile, validateFile } from '@/lib/storageService'
import type { DealRecord, DealEventRecord, DealDocumentRecord } from '@/lib/domain/deal'

type Deal = DealRecord
type DealEvent = DealEventRecord
type DealDocument = DealDocumentRecord

const STATUS_OPTIONS = ['reserved', 'negotiating', 'contract_signed', 'financing', 'closing', 'closed', 'cancelled']
const EVENT_OPTIONS = ['reservation_created', 'price_changed', 'document_uploaded', 'contract_signed', 'payment_received', 'commission_calculated', 'deal_closed']
const DOCUMENT_TYPES = ['reservation_form', 'contract', 'deposit_receipt', 'buyer_id', 'closing_document', 'other']

function formatTimestamp(value: unknown): string {
  if (!value) return '—'

  if (value instanceof Date) {
    return value.toLocaleString()
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const parsed = new Date(value)
    return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : '—'
  }

  if (typeof value === 'object') {
    const maybeSeconds = (value as { seconds?: unknown }).seconds
    if (typeof maybeSeconds === 'number') {
      return new Date(maybeSeconds * 1000).toLocaleString()
    }

    const maybeToDate = (value as { toDate?: unknown }).toDate
    if (typeof maybeToDate === 'function') {
      const converted = maybeToDate.call(value)
      if (converted instanceof Date) return converted.toLocaleString()
    }
  }

  return '—'
}

export default function ConstructoraDealDetailPage() {
  const params = useParams<{ id: string }>()
  const dealId = String(params?.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deal, setDeal] = useState<Deal | null>(null)
  const [events, setEvents] = useState<DealEvent[]>([])
  const [documents, setDocuments] = useState<DealDocument[]>([])
  const [savingStatus, setSavingStatus] = useState(false)
  const [addingEvent, setAddingEvent] = useState(false)
  const [uploadingDocument, setUploadingDocument] = useState(false)
  const [deletingDocumentId, setDeletingDocumentId] = useState('')
  const [statusDraft, setStatusDraft] = useState('reserved')
  const [eventType, setEventType] = useState('price_changed')
  const [eventNote, setEventNote] = useState('')
  const [documentType, setDocumentType] = useState('contract')

  async function load() {
    if (!dealId) return
    try {
      setLoading(true)
      setError('')

      const [dealRes, eventsRes, documentsRes] = await Promise.all([
        fetch(`/api/constructora/dashboard/deals/${dealId}`, { cache: 'no-store' }),
        fetch(`/api/constructora/dashboard/deals/${dealId}/events`, { cache: 'no-store' }),
        fetch(`/api/constructora/dashboard/deals/${dealId}/documents`, { cache: 'no-store' }),
      ])

      const dealJson = await dealRes.json().catch(() => ({}))
      const eventsJson = await eventsRes.json().catch(() => ({}))
      const documentsJson = await documentsRes.json().catch(() => ({}))

      if (!dealRes.ok || !dealJson?.ok) throw new Error(dealJson?.error || 'No se pudo cargar el deal')
      if (!eventsRes.ok || !eventsJson?.ok) throw new Error(eventsJson?.error || 'No se pudo cargar el timeline')
      if (!documentsRes.ok || !documentsJson?.ok) throw new Error(documentsJson?.error || 'No se pudieron cargar los documentos')

      setDeal(dealJson.deal)
      setStatusDraft(String(dealJson.deal?.status || 'reserved'))
      setEvents(Array.isArray(eventsJson?.events) ? eventsJson.events : [])
      setDocuments(Array.isArray(documentsJson?.documents) ? documentsJson.documents : [])
    } catch (loadError: any) {
      setError(loadError?.message || 'No se pudo cargar el deal')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [dealId])

  const updateStatus = async () => {
    if (!dealId) return
    try {
      setSavingStatus(true)
      setError('')

      const res = await fetch(`/api/constructora/dashboard/deals/${dealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDraft }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo actualizar el status')

      await load()
    } catch (updateError: any) {
      setError(updateError?.message || 'No se pudo actualizar el status')
    } finally {
      setSavingStatus(false)
    }
  }

  const addEvent = async () => {
    if (!dealId) return
    try {
      setAddingEvent(true)
      setError('')

      const res = await fetch(`/api/constructora/dashboard/deals/${dealId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: eventType,
          metadata: eventNote.trim() ? { note: eventNote.trim() } : {},
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo registrar el evento')

      setEventNote('')
      await load()
    } catch (eventError: any) {
      setError(eventError?.message || 'No se pudo registrar el evento')
    } finally {
      setAddingEvent(false)
    }
  }

  const uploadDocument = async (file: File) => {
    if (!dealId || !file) return
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Archivo inválido')
      return
    }

    try {
      setUploadingDocument(true)
      setError('')

      const timestamp = Date.now()
      const safeName = file.name.replace(/\s+/g, '_')
      const path = `deals/${dealId}/${timestamp}-${safeName}`
      const fileUrl = await uploadFile(file, path)

      const res = await fetch(`/api/constructora/dashboard/deals/${dealId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: documentType,
          fileUrl,
          fileName: file.name,
          size: file.size,
          mimeType: file.type,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo guardar el documento')

      await load()
    } catch (uploadError: any) {
      setError(uploadError?.message || 'No se pudo subir el documento')
    } finally {
      setUploadingDocument(false)
    }
  }

  const deleteDocument = async (documentId: string) => {
    if (!dealId || !documentId) return
    try {
      setDeletingDocumentId(documentId)
      setError('')

      const res = await fetch(`/api/constructora/dashboard/deals/${dealId}/documents/${documentId}`, {
        method: 'DELETE',
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo eliminar el documento')

      await load()
    } catch (deleteError: any) {
      setError(deleteError?.message || 'No se pudo eliminar el documento')
    } finally {
      setDeletingDocumentId('')
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">Deal Detail</h2>
      {loading ? <p className="mt-2 text-sm text-gray-600">Cargando deal...</p> : null}
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}

      {deal && !loading && (
        <>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <Info label="Deal ID" value={deal.id} />
            <Info label="Unit" value={deal.unitId || '—'} />
            <Info label="Project" value={deal.projectId || '—'} />
            <Info label="Reservation" value={deal.reservationId || '—'} />
            <Info label="Buyer" value={deal.buyerName || '—'} />
            <Info label="Broker" value={deal.brokerName || '—'} />
            <Info label="Price" value={`${Number(deal.price || 0).toLocaleString()} ${deal.currency || 'USD'}`} />
            <Info label="Current status" value={deal.status || 'reserved'} />
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <div className="text-sm font-semibold text-gray-900">Actualizar status</div>
            <div className="mt-2 flex flex-col md:flex-row gap-2 md:items-center">
              <select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white" title="Deal status">
                {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
              <button onClick={updateStatus} disabled={savingStatus} className="px-3 py-2 text-sm font-medium text-white bg-[#0B2545] rounded-lg hover:bg-[#12355f] disabled:opacity-50">
                {savingStatus ? 'Guardando...' : 'Guardar status'}
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <div className="text-sm font-semibold text-gray-900">Agregar evento</div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              <select value={eventType} onChange={(e) => setEventType(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white" title="Event type">
                {EVENT_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <input value={eventNote} onChange={(e) => setEventNote(e.target.value)} placeholder="nota o metadata" className="md:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg" title="Event note" />
            </div>
            <button onClick={addEvent} disabled={addingEvent} className="mt-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
              {addingEvent ? 'Registrando...' : 'Registrar evento'}
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <div className="text-sm font-semibold text-gray-900">Timeline</div>
            <div className="mt-2 space-y-2">
              {events.map((event) => (
                <div key={event.id} className="rounded-lg border border-gray-200 p-2">
                  <div className="text-xs font-semibold text-[#0B2545]">{event.type}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {formatTimestamp(event.createdAt)}
                  </div>
                  {event.metadata ? (
                    <pre className="mt-1 text-[11px] text-gray-600 whitespace-pre-wrap">{JSON.stringify(event.metadata, null, 2)}</pre>
                  ) : null}
                </div>
              ))}
              {!events.length ? <p className="text-sm text-gray-500">No hay eventos todavía.</p> : null}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <div className="text-sm font-semibold text-gray-900">Documents</div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
              <select value={documentType} onChange={(e) => setDocumentType(e.target.value)} className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white" title="Document type">
                {DOCUMENT_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
              <input
                type="file"
                className="md:col-span-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadDocument(file)
                  e.currentTarget.value = ''
                }}
                title="Upload document"
              />
            </div>
            {uploadingDocument ? <p className="mt-2 text-xs text-gray-500">Subiendo documento...</p> : null}

            <div className="mt-3 space-y-2">
              {documents.map((document) => (
                <div key={document.id} className="rounded-lg border border-gray-200 p-2 text-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <div className="font-medium text-gray-900 break-all">{document.fileName || 'Documento'}</div>
                      <div className="text-xs text-gray-600">
                        {document.type || 'other'} • {formatTimestamp(document.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={document.fileUrl} target="_blank" rel="noreferrer" className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Preview</a>
                      <a href={document.fileUrl} download className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50">Download</a>
                      <button
                        onClick={() => deleteDocument(document.id)}
                        disabled={deletingDocumentId === document.id}
                        className="px-2 py-1 text-xs border border-red-200 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingDocumentId === document.id ? 'Eliminando...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {!documents.length ? <p className="text-sm text-gray-500">No hay documentos todavía.</p> : null}
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-sm font-medium text-gray-900 break-all">{value}</div>
    </div>
  )
}
