'use client'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import { useEffect, useMemo, useState } from 'react'
import { FiCreditCard, FiTrendingUp, FiUsers, FiRefreshCw, FiCopy, FiExternalLink, FiShield, FiCheckCircle, FiAlertTriangle, FiSettings, FiLink } from 'react-icons/fi'

type BillingSettings = {
  publishableKey?: string
  priceIds: { agent?: string; broker?: string }
  wallets: { applePay: boolean; googlePay: boolean }
}

type Customer = { id: string; email: string; name?: string; createdAt: string }

type Subscription = { id: string; customerId: string; plan: 'agent'|'broker'; status: 'active'|'trialing'|'canceled'|'past_due'; currentPeriodEnd?: string }

type Invoice = { id: string; customerId: string; amount: number; currency: string; status: 'paid'|'open'|'void'|'uncollectible'; createdAt: string }

type Stats = { mrrUSD: number; activeSubs: number; churnRatePct: number; invoicesDue: number }

function StatCard({ title, value, icon }: { title: string; value: string; icon: JSX.Element }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center gap-3 text-gray-700">
        <span className="text-2xl text-[#0B2545]">{icon}</span>
        <div>
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  )
}

export default function AdminBillingPage() {
  const [tab, setTab] = useState<'overview'|'plans'|'customers'|'subscriptions'|'invoices'|'wallets'|'settings'>('overview')
  const [stats, setStats] = useState<Stats>({ mrrUSD: 0, activeSubs: 0, churnRatePct: 0, invoicesDue: 0 })
  const [settings, setSettings] = useState<BillingSettings>({ priceIds: {}, wallets: { applePay: false, googlePay: false } })
  const [loading, setLoading] = useState(false)

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([])
  const [subs, setSubs] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])

  useEffect(() => {
    refreshAll()
  }, [])

  async function refreshAll() {
    setLoading(true)
    try {
      const [s, cfg, cs, ss, inv] = await Promise.all([
        fetch('/api/admin/billing/stats').then(r=>r.json()).catch(()=>null),
        fetch('/api/admin/billing/settings').then(r=>r.json()).catch(()=>null),
        fetch('/api/admin/billing/customers').then(r=>r.json()).catch(()=>null),
        fetch('/api/admin/billing/subscriptions').then(r=>r.json()).catch(()=>null),
        fetch('/api/admin/billing/invoices').then(r=>r.json()).catch(()=>null),
      ])
      if (s?.ok) setStats(s.data)
      if (cfg?.ok) setSettings(cfg.data)
      if (cs?.ok) setCustomers(cs.data)
      if (ss?.ok) setSubs(ss.data)
      if (inv?.ok) setInvoices(inv.data)
    } finally {
      setLoading(false)
    }
  }

  const activeCustomers = useMemo(()=>{
    const setIds = new Set(subs.filter(x=>x.status==='active' || x.status==='trialing').map(x=>x.customerId))
    return customers.filter(c=>setIds.has(c.id))
  }, [customers, subs])

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault()
    const res = await fetch('/api/admin/billing/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings)
    })
    if (res.ok) {
      refreshAll()
      alert('Billing settings saved')
    } else {
      alert('Failed to save settings')
    }
  }

  async function createPaymentLink(plan: 'agent'|'broker', email?: string) {
    const res = await fetch('/api/admin/billing/payment-link', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan, email })
    })
    const data = await res.json()
    if (data?.url) {
      navigator.clipboard.writeText(data.url).catch(()=>{})
      alert('Payment link created and copied to clipboard')
    } else {
      alert(data?.error || 'Failed to create payment link')
    }
  }

  async function createCustomer(email: string, name?: string) {
    const res = await fetch('/api/admin/billing/customers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name })
    })
    const data = await res.json()
    if (data?.ok) { refreshAll() } else { alert('Failed to create customer') }
  }

  async function createSubscription(email: string, plan: 'agent'|'broker') {
    const res = await fetch('/api/admin/billing/subscriptions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, plan })
    })
    const data = await res.json()
    if (data?.ok) { refreshAll() } else { alert(data?.error || 'Failed to create subscription') }
  }

  return (
    <ProtectedClient allowed={['master_admin']}> 
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#0B2545]">Billing & Subscriptions</h1>
            <button onClick={refreshAll} className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50"><FiRefreshCw/> Refresh</button>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto">
            {[
              ['overview','Overview'],
              ['plans','Plans & Pricing'],
              ['customers','Customers'],
              ['subscriptions','Subscriptions'],
              ['invoices','Invoices'],
              ['wallets','Wallets'],
              ['settings','Settings'],
            ].map(([key,label])=> (
              <button key={key} onClick={()=>setTab(key as any)} className={`px-4 py-2 rounded-lg text-sm font-semibold border ${tab===key? 'bg-[#00A676] text-white border-[#00A676]':'bg-white text-gray-700 hover:bg-gray-50'}`}>{label}</button>
            ))}
          </div>

          {tab==='overview' && (
            <section className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="MRR" value={`$${stats.mrrUSD.toLocaleString()}`} icon={<FiTrendingUp/>} />
                <StatCard title="Active Subs" value={`${stats.activeSubs}`} icon={<FiUsers/>} />
                <StatCard title="Churn" value={`${stats.churnRatePct}%`} icon={<FiAlertTriangle/>} />
                <StatCard title="Invoices Due" value={`${stats.invoicesDue}`} icon={<FiCreditCard/>} />
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
                <div className="flex flex-wrap gap-3">
                  <button onClick={()=>createPaymentLink('agent')} className="px-4 py-2 bg-[#004AAD] text-white rounded-lg inline-flex items-center gap-2"><FiLink/> Create Agent Payment Link</button>
                  <button onClick={()=>createPaymentLink('broker')} className="px-4 py-2 bg-[#00A6A6] text-white rounded-lg inline-flex items-center gap-2"><FiLink/> Create Broker Payment Link</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Payment links open Stripe Checkout. Apple Pay and Google Pay are supported by Stripe Checkout when available. Native flows: coming soon.</p>
              </div>
            </section>
          )}

          {tab==='plans' && (
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-semibold mb-4">Plans & Price IDs</h2>
                <form onSubmit={saveSettings} className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Stripe Publishable Key</label>
                    <input className="w-full mt-1 px-3 py-2 border rounded-lg" value={settings.publishableKey||''} onChange={e=>setSettings(s=>({...s, publishableKey:e.target.value}))} placeholder="pk_test_..."/>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Agent Price ID</label>
                    <input className="w-full mt-1 px-3 py-2 border rounded-lg" value={settings.priceIds.agent||''} onChange={e=>setSettings(s=>({...s, priceIds:{...s.priceIds, agent:e.target.value}}))} placeholder="price_..."/>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Broker Price ID</label>
                    <input className="w-full mt-1 px-3 py-2 border rounded-lg" value={settings.priceIds.broker||''} onChange={e=>setSettings(s=>({...s, priceIds:{...s.priceIds, broker:e.target.value}}))} placeholder="price_..."/>
                  </div>
                  <button type="submit" className="px-5 py-2 bg-[#00A676] text-white rounded-lg">Save</button>
                </form>
              </div>

              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-semibold mb-2">Guidance</h2>
                <ul className="list-disc ml-5 text-sm text-gray-700 space-y-2">
                  <li>Create Products and recurring Prices in Stripe (monthly/yearly).</li>
                  <li>Copy the Price IDs here for Agent and Broker.</li>
                  <li>Stripe Checkout automatically offers Apple Pay / Google Pay where supported.</li>
                  <li>Use Payment Links or create subscriptions directly for a customer.</li>
                </ul>
              </div>
            </section>
          )}

          {tab==='customers' && (
            <section className="bg-white rounded-lg shadow p-5">
              <h2 className="text-lg font-semibold mb-4">Customers</h2>
              <CreateCustomerForm onCreate={createCustomer} />
              <div className="mt-6 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left text-gray-500"><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Created</th></tr></thead>
                  <tbody>
                    {customers.map(c=> (
                      <tr key={c.id} className="border-t"><td className="py-2 pr-4">{c.email}</td><td className="py-2 pr-4">{c.name||'-'}</td><td className="py-2 pr-4">{new Date(c.createdAt).toLocaleString()}</td></tr>
                    ))}
                    {customers.length===0 && <tr><td className="py-6 text-gray-500" colSpan={3}>No customers yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab==='subscriptions' && (
            <section className="bg-white rounded-lg shadow p-5">
              <h2 className="text-lg font-semibold mb-4">Subscriptions</h2>
              <CreateSubscriptionForm onCreate={createSubscription} />
              <div className="mt-6 overflow-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left text-gray-500"><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Plan</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Period End</th></tr></thead>
                  <tbody>
                    {subs.map(s=> (
                      <tr key={s.id} className="border-t">
                        <td className="py-2 pr-4">{customers.find(c=>c.id===s.customerId)?.email || s.customerId}</td>
                        <td className="py-2 pr-4 capitalize">{s.plan}</td>
                        <td className="py-2 pr-4">{s.status}</td>
                        <td className="py-2 pr-4">{s.currentPeriodEnd? new Date(s.currentPeriodEnd).toLocaleDateString(): '-'}</td>
                      </tr>
                    ))}
                    {subs.length===0 && <tr><td className="py-6 text-gray-500" colSpan={4}>No subscriptions yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab==='invoices' && (
            <section className="bg-white rounded-lg shadow p-5">
              <h2 className="text-lg font-semibold mb-4">Invoices</h2>
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left text-gray-500"><th className="py-2 pr-4">Invoice</th><th className="py-2 pr-4">Customer</th><th className="py-2 pr-4">Amount</th><th className="py-2 pr-4">Currency</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Created</th></tr></thead>
                  <tbody>
                    {invoices.map(i=> (
                      <tr key={i.id} className="border-t">
                        <td className="py-2 pr-4">{i.id}</td>
                        <td className="py-2 pr-4">{customers.find(c=>c.id===i.customerId)?.email || i.customerId}</td>
                        <td className="py-2 pr-4">${'{'}i.amount.toLocaleString(){'}'}</td>
                        <td className="py-2 pr-4">{i.currency.toUpperCase()}</td>
                        <td className="py-2 pr-4">{i.status}</td>
                        <td className="py-2 pr-4">{new Date(i.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                    {invoices.length===0 && <tr><td className="py-6 text-gray-500" colSpan={6}>No invoices yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {tab==='wallets' && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><FiShield/> Apple Pay</h2>
                <p className="text-sm text-gray-600 mb-4">Apple Pay via Stripe Checkout is automatically offered on supported devices and domains. Native domain verification flow is coming soon.</p>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-800 rounded">Coming Soon <FiAlertTriangle/></span>
              </div>
              <div className="bg-white rounded-lg shadow p-5">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><FiShield/> Google Pay</h2>
                <p className="text-sm text-gray-600 mb-4">Google Pay via Stripe Checkout is automatically offered on supported devices and browsers. Native Google Pay API flow is coming soon.</p>
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 text-yellow-800 rounded">Coming Soon <FiAlertTriangle/></span>
              </div>
            </section>
          )}

          {tab==='settings' && (
            <section className="bg-white rounded-lg shadow p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><FiSettings/> Integration Settings</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Webhook endpoint</div>
                  <code className="text-xs bg-gray-100 rounded px-2 py-1">/api/stripe/webhook</code>
                </div>
                <div className="text-sm text-gray-600">Create a webhook in Stripe for: checkout.session.completed, customer.subscription.updated, invoice.payment_succeeded, invoice.payment_failed</div>
                <div className="text-sm text-gray-600">Set STRIPE_WEBHOOK_SECRET in environment and handle signature verification (TODO).</div>
              </div>
            </section>
          )}
        </main>
      </div>
    </ProtectedClient>
  )
}

function CreateCustomerForm({ onCreate }:{ onCreate: (email:string, name?:string)=>void }){
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  return (
    <div className="flex flex-col md:flex-row gap-2 items-start md:items-end">
      <div className="flex-1">
        <label className="text-sm font-semibold text-gray-700">Email</label>
        <input className="w-full mt-1 px-3 py-2 border rounded-lg" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@example.com"/>
      </div>
      <div className="flex-1">
        <label className="text-sm font-semibold text-gray-700">Name</label>
        <input className="w-full mt-1 px-3 py-2 border rounded-lg" value={name} onChange={e=>setName(e.target.value)} placeholder="Full name (optional)"/>
      </div>
      <button onClick={()=>onCreate(email, name)} className="px-5 py-2 bg-[#00A676] text-white rounded-lg">Create Customer</button>
    </div>
  )
}

function CreateSubscriptionForm({ onCreate }:{ onCreate: (email:string, plan:'agent'|'broker')=>void }){
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<'agent'|'broker'>('agent')
  return (
    <div className="flex flex-col md:flex-row gap-2 items-start md:items-end">
      <div className="flex-1">
        <label className="text-sm font-semibold text-gray-700">Customer Email</label>
        <input className="w-full mt-1 px-3 py-2 border rounded-lg" value={email} onChange={e=>setEmail(e.target.value)} placeholder="user@example.com"/>
      </div>
      <div>
        <label className="text-sm font-semibold text-gray-700">Plan</label>
        <select className="w-full mt-1 px-3 py-2 border rounded-lg" value={plan} onChange={e=>setPlan(e.target.value as any)}>
          <option value="agent">Agent</option>
          <option value="broker">Broker</option>
        </select>
      </div>
      <button onClick={()=>onCreate(email, plan)} className="px-5 py-2 bg-[#004AAD] text-white rounded-lg">Create Subscription</button>
    </div>
  )
}
