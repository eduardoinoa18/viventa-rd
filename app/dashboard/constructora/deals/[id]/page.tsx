'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

type Deal = {
  id: string
  unitId: string
  projectId: string
  reservationId: string
  buyerName: string
  brokerName: string
  price: number
  currency: string
  status: string
  createdAt: any
  updatedAt: any
}

type DealEvent = {
  id: string
  type: string
  actorId: string
  metadata?: Record<string, any>
  createdAt: any
}

const STATUS_OPTIONS = ['reserved', 'negotiating', 'contract_signed', 'financing', 'closing', 'closed', 'cancelled']
const EVENT_OPTIONS = ['reservation_created', 'price_changed', 'document_uploaded', 'contract_signed', 'payment_received', 'commission_calculated', 'deal_closed']

export default function ConstructoraDealDetailPage() {
  const params = useParams<{ id: string }>()
  const dealId = String(params?.id || '')

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deal, setDeal] = useState<Deal | null>(null)
  const [events, setEvents] = useState<DealEvent[]>([])
  const [savingStatus, setSavingStatus] = useState(false)
  const [addingEvent, setAddingEvent] = useState(false)
  const [statusDraft, setStatusDraft] = useState('reserved')
  const [eventType, setEventType] = useState('price_changed')
  const [eventNote, setEventNote] = useState('')

  async function load() {
    if (!dealId) return
    try {
      setLoading(true)
      setError('')

      const [dealRes, eventsRes] = await Promise.all([
        fetch(`/api/constructora/dashboard/deals/${dealId}`, { cache: 'no-store' }),
        fetch(`/api/constructora/dashboard/deals/${dealId}/events`, { cache: 'no-store' }),
      ])

      const dealJson = await dealRes.json().catch(() => ({}))
      const eventsJson = await eventsRes.json().catch(() => ({}))

      if (!dealRes.ok || !dealJson?.ok) throw new Error(dealJson?.error || 'No se pudo cargar el deal')
      if (!eventsRes.ok || !eventsJson?.ok) throw new Error(eventsJson?.error || 'No se pudo cargar el timeline')

      setDeal(dealJson.deal)
      setStatusDraft(String(dealJson.deal?.status || 'reserved'))
      setEvents(Array.isArray(eventsJson?.events) ? eventsJson.events : [])
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
                    {event.createdAt ? new Date((event.createdAt?.seconds ? event.createdAt.seconds * 1000 : event.createdAt)).toLocaleString() : '—'}
                  </div>
                  {event.metadata ? (
                    <pre className="mt-1 text-[11px] text-gray-600 whitespace-pre-wrap">{JSON.stringify(event.metadata, null, 2)}</pre>
                  ) : null}
                </div>
              ))}
              {!events.length ? <p className="text-sm text-gray-500">No hay eventos todavía.</p> : null}
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
