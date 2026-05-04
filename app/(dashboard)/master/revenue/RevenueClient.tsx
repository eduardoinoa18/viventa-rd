'use client'

import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { FiRefreshCw, FiDollarSign, FiAlertCircle, FiCheckCircle, FiClock, FiTrash2 } from 'react-icons/fi'

type RevenueOverview = {
  totals: {
    records: number
    activeOrTrialing: number
    pastDue: number
    canceled: number
    paymentFailures: number
    healthScore: number
  }
  statusBuckets: Record<string, number>
  paymentBuckets: Record<string, number>
  priceBreakdown: Array<{ priceId: string; subscribers: number }>
  recentStripeEvents: Array<{ id: string; type: string; createdAt: string }>
}

type BillingPlan = {
  id: string
  name: string
  interval: string
  amount: number
  currency: string
  active: boolean
  roleScope?: string[]
}

type SubscriptionRequest = {
  id: string
  name: string
  email: string
  role: string
  planId: string
  status: string
  userId?: string | null
  createCredentials?: boolean
}

const DEFAULT_DATA: RevenueOverview = {
  totals: {
    records: 0,
    activeOrTrialing: 0,
    pastDue: 0,
    canceled: 0,
    paymentFailures: 0,
    healthScore: 0,
  },
  statusBuckets: {},
  paymentBuckets: {},
  priceBreakdown: [],
  recentStripeEvents: [],
}

function formatRelative(value?: string) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return '—'

  const diffMs = Date.now() - parsed.getTime()
  if (diffMs < 0) return 'ahora mismo'
  const minutes = Math.floor(diffMs / (1000 * 60))
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (minutes < 1) return 'ahora mismo'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function RevenueClient() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<RevenueOverview>(DEFAULT_DATA)
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [requests, setRequests] = useState<SubscriptionRequest[]>([])
  const [savingPlan, setSavingPlan] = useState(false)
  const [savingRequest, setSavingRequest] = useState(false)
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null)
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null)

  const [newPlan, setNewPlan] = useState({
    name: '',
    interval: 'monthly',
    amount: 0,
    currency: 'USD',
    description: '',
    stripePriceId: '',
    active: true,
  })

  const [newRequest, setNewRequest] = useState({
    name: '',
    email: '',
    role: 'agent',
    planId: '',
    notes: '',
    createCredentials: true,
    phone: '',
    company: '',
    contactPerson: '',
  })

  const loadOverview = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/revenue/overview')
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'Unable to load revenue overview')
      }

      setData(json.data || DEFAULT_DATA)
    } catch (error: any) {
      console.error('revenue overview error', error)
      toast.error(error?.message || 'No se pudo cargar el resumen de ingresos')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadOperations = useCallback(async () => {
    try {
      const [plansRes, requestsRes] = await Promise.all([
        fetch('/api/admin/revenue/plans'),
        fetch('/api/admin/revenue/subscription-requests'),
      ])

      const [plansJson, requestsJson] = await Promise.all([plansRes.json(), requestsRes.json()])
      if (plansRes.ok && plansJson?.ok && Array.isArray(plansJson.data)) setPlans(plansJson.data)
      if (requestsRes.ok && requestsJson?.ok && Array.isArray(requestsJson.data)) setRequests(requestsJson.data)
    } catch (error) {
      console.error('load revenue operations error', error)
    }
  }, [])

  async function createPlan() {
    if (!newPlan.name.trim() || !newPlan.interval || newPlan.amount <= 0) {
      toast.error('Nombre del plan, intervalo y monto son requeridos')
      return
    }

    setSavingPlan(true)
    try {
      const res = await fetch('/api/admin/revenue/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newPlan,
          roleScope: ['agent', 'broker', 'constructora'],
        }),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) {
        toast.error(json.error || 'No se pudo crear el plan')
        return
      }
      toast.success('Tipo de suscripción creado')
      setNewPlan({ name: '', interval: 'monthly', amount: 0, currency: 'USD', description: '', stripePriceId: '', active: true })
      await loadOperations()
    } catch (error) {
      console.error('create plan error', error)
      toast.error('No se pudo crear el plan')
    } finally {
      setSavingPlan(false)
    }
  }

  async function createSubscriptionRequest() {
    if (!newRequest.name.trim() || !newRequest.email.trim() || !newRequest.planId) {
      toast.error('Nombre, correo y plan son requeridos')
      return
    }

    setSavingRequest(true)
    try {
      const res = await fetch('/api/admin/revenue/subscription-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      })
      const json = await res.json()
      if (!res.ok || !json?.ok) {
        toast.error(json.error || 'No se pudo crear la solicitud')
        return
      }
      toast.success(newRequest.createCredentials ? 'Solicitud creada e invitación con credenciales enviada' : 'Solicitud de suscripción creada')
      setNewRequest({
        name: '',
        email: '',
        role: 'agent',
        planId: '',
        notes: '',
        createCredentials: true,
        phone: '',
        company: '',
        contactPerson: '',
      })
      await loadOperations()
    } catch (error) {
      console.error('create subscription request error', error)
      toast.error('No se pudo crear la solicitud')
    } finally {
      setSavingRequest(false)
    }
  }

  async function deletePlan(plan: BillingPlan) {
    if (!confirm(`¿Eliminar el plan "${plan.name}"?`)) return
    setDeletingPlanId(plan.id)
    try {
      const res = await fetch('/api/admin/revenue/plans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'No se pudo eliminar el plan')
        return
      }
      toast.success('Plan eliminado')
      await loadOperations()
    } catch (error) {
      console.error('delete plan error', error)
      toast.error('No se pudo eliminar el plan')
    } finally {
      setDeletingPlanId(null)
    }
  }

  async function deleteRequest(request: SubscriptionRequest) {
    if (!confirm(`¿Eliminar invitación/solicitud de ${request.name}?`)) return
    setDeletingRequestId(request.id)
    try {
      const res = await fetch('/api/admin/revenue/subscription-requests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: request.id }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        toast.error(json?.error || 'No se pudo eliminar la invitación')
        return
      }
      toast.success('Invitación/solicitud eliminada')
      await loadOperations()
    } catch (error) {
      console.error('delete request error', error)
      toast.error('No se pudo eliminar la invitación')
    } finally {
      setDeletingRequestId(null)
    }
  }

  useEffect(() => {
    loadOverview()
    loadOperations()
  }, [loadOverview, loadOperations])

  const cards = [
    { label: 'Billing Records', value: data.totals.records, tone: 'text-[#0B2545]', icon: <FiDollarSign /> },
    { label: 'Active / Trialing', value: data.totals.activeOrTrialing, tone: 'text-green-700', icon: <FiCheckCircle /> },
    { label: 'Past Due', value: data.totals.pastDue, tone: 'text-amber-700', icon: <FiClock /> },
    { label: 'Payment Failures', value: data.totals.paymentFailures, tone: 'text-red-700', icon: <FiAlertCircle /> },
    { label: 'Health Score', value: `${data.totals.healthScore}%`, tone: 'text-[#0B2545]', icon: <FiCheckCircle /> },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0B2545]">Revenue & Billing</h1>
          <p className="text-sm text-gray-600 mt-1">Subscription health, payment risk, and Stripe activity monitoring.</p>
        </div>
        <button
          onClick={loadOverview}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-100 disabled:opacity-60"
          title="Reload revenue and billing metrics"
        >
          <FiRefreshCw /> Refresh
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center justify-between">
              <span>{card.label}</span>
              <span className={card.tone}>{card.icon}</span>
            </div>
            <div className={`mt-2 text-2xl font-bold ${card.tone}`}>{card.value}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Subscription Status Mix</h2>
          <div className="mt-3 space-y-2">
            {Object.keys(data.statusBuckets).length === 0 ? (
              <div className="text-xs text-gray-500">No billing status data yet.</div>
            ) : (
              Object.entries(data.statusBuckets).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
                  <span className="text-xs text-gray-700 capitalize">{status.replace('_', ' ')}</span>
                  <span className="text-xs font-semibold text-[#0B2545]">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Plan Price IDs</h2>
          <div className="mt-3 space-y-2">
            {data.priceBreakdown.length === 0 ? (
              <div className="text-xs text-gray-500">No plan-linked subscriptions tracked yet.</div>
            ) : (
              data.priceBreakdown.slice(0, 8).map((plan) => (
                <div key={plan.priceId} className="rounded-md border border-gray-200 px-3 py-2">
                  <div className="text-[11px] text-gray-600 break-all">{plan.priceId}</div>
                  <div className="text-xs font-semibold text-[#0B2545] mt-1">{plan.subscribers} subscribers</div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Recent Stripe Events</h2>
        <div className="mt-3 space-y-2">
          {data.recentStripeEvents.length === 0 ? (
            <div className="text-xs text-gray-500">No Stripe events captured yet.</div>
          ) : (
            data.recentStripeEvents.map((event) => (
              <div key={event.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 px-3 py-2">
                <div className="text-xs font-medium text-[#0B2545]">{event.type}</div>
                <div className="text-[11px] text-gray-500">{formatRelative(event.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Create Subscription Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newPlan.name} onChange={(e) => setNewPlan((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre del plan" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <select value={newPlan.interval} onChange={(e) => setNewPlan((prev) => ({ ...prev, interval: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" aria-label="Plan interval">
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input type="number" value={newPlan.amount} onChange={(e) => setNewPlan((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))} placeholder="Monto" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={newPlan.currency} onChange={(e) => setNewPlan((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))} placeholder="Moneda" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={newPlan.stripePriceId} onChange={(e) => setNewPlan((prev) => ({ ...prev, stripePriceId: e.target.value }))} placeholder="Stripe Price ID (opcional)" className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-2" />
            <input value={newPlan.description} onChange={(e) => setNewPlan((prev) => ({ ...prev, description: e.target.value }))} placeholder="Descripción" className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-2" />
          </div>
          <button onClick={createPlan} disabled={savingPlan} className="px-4 py-2 rounded-lg bg-[#0B2545] text-white hover:bg-[#133a66] disabled:opacity-60 text-sm">
            {savingPlan ? 'Creating...' : 'Create Plan'}
          </button>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            {plans.length === 0 ? (
              <p className="text-xs text-gray-500">No subscription types created yet.</p>
            ) : (
              plans.slice(0, 6).map((plan) => (
                <div key={plan.id} className="rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700 flex items-center justify-between gap-2">
                  <span>{plan.name} • {plan.interval} • {plan.currency} {plan.amount}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full ${plan.active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{plan.active ? 'active' : 'inactive'}</span>
                    <button
                      type="button"
                      onClick={() => deletePlan(plan)}
                      disabled={deletingPlanId === plan.id}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                    >
                      <FiTrash2 className="w-3 h-3" />
                      {deletingPlanId === plan.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Send Subscription Request & Credentials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={newRequest.name} onChange={(e) => setNewRequest((prev) => ({ ...prev, name: e.target.value }))} placeholder="Nombre completo" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={newRequest.email} onChange={(e) => setNewRequest((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <select value={newRequest.role} onChange={(e) => setNewRequest((prev) => ({ ...prev, role: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" aria-label="Role">
              <option value="agent">Agent</option>
              <option value="broker">Broker</option>
              <option value="constructora">Constructora</option>
            </select>
            <select value={newRequest.planId} onChange={(e) => setNewRequest((prev) => ({ ...prev, planId: e.target.value }))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm" aria-label="Plan">
              <option value="">Select plan</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>{plan.name} ({plan.currency} {plan.amount})</option>
              ))}
            </select>
            <input value={newRequest.phone} onChange={(e) => setNewRequest((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Teléfono" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={newRequest.company} onChange={(e) => setNewRequest((prev) => ({ ...prev, company: e.target.value }))} placeholder="Empresa" className="px-3 py-2 border border-gray-300 rounded-lg text-sm" />
            <input value={newRequest.contactPerson} onChange={(e) => setNewRequest((prev) => ({ ...prev, contactPerson: e.target.value }))} placeholder="Persona de contacto" className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-2" />
            <input value={newRequest.notes} onChange={(e) => setNewRequest((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Notas internas" className="px-3 py-2 border border-gray-300 rounded-lg text-sm md:col-span-2" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={newRequest.createCredentials} onChange={(e) => setNewRequest((prev) => ({ ...prev, createCredentials: e.target.checked }))} />
            Create credentials and send invite now
          </label>
          <button onClick={createSubscriptionRequest} disabled={savingRequest} className="px-4 py-2 rounded-lg bg-[#00A676] text-white hover:bg-[#008f60] disabled:opacity-60 text-sm">
            {savingRequest ? 'Sending...' : 'Create Request'}
          </button>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            {requests.length === 0 ? (
              <p className="text-xs text-gray-500">No subscription requests yet.</p>
            ) : (
              requests.slice(0, 8).map((req) => (
                <div key={req.id} className="rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-700">
                  <div className="font-medium text-[#0B2545]">{req.name} • {req.role}</div>
                  <div>{req.email}</div>
                  <div className="mt-1 flex items-center justify-between">
                    <span>Plan: {req.planId}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full ${req.status === 'approved' ? 'bg-green-100 text-green-800' : req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{req.status}</span>
                      <button
                        type="button"
                        onClick={() => deleteRequest(req)}
                        disabled={deletingRequestId === req.id}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        <FiTrash2 className="w-3 h-3" />
                        {deletingRequestId === req.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
