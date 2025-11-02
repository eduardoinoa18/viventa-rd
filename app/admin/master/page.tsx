"use client"
import { useEffect, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, onSnapshot } from 'firebase/firestore'
import { useRequireRole } from '../../../lib/useRequireRole'
import AdminCodeModal from '../../../components/AdminCodeModal'
import ListingsModeration from './ListingsModeration'

const TABS = [
  'Dashboard', 'Listings', 'Users', 'Brokerages', 'Applications', 'Clients & CRM', 'Inbox', 'Settings', 'Analytics', 'Audit Logs', 'Billing'
]

export default function MasterAdminPage() {
  const { loading, ok, showModal, setShowModal } = useRequireRole(['master_admin'])
  const [tab, setTab] = useState('Dashboard')
  const [stats, setStats] = useState<any>({ listings: 0, agents: 0, invites: 0, leads: 0, searches: 0 })

  useEffect(() => {
    // Real-time listeners for KPIs
    const unsubListings = onSnapshot(collection(db, 'listings'), (snap: any) => setStats((s: any) => ({ ...s, listings: snap.size })))
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap: any) => setStats((s: any) => ({ ...s, agents: snap.docs.filter((d: any) => d.data().role === 'agent').length })))
    const unsubInvites = onSnapshot(collection(db, 'invites'), (snap: any) => setStats((s: any) => ({ ...s, invites: snap.size })))
    // TODO: leads, searches, audit_logs, etc.
    return () => { unsubListings(); unsubUsers(); unsubInvites() }
  }, [])

  if (loading) return <div>Loading...</div>
  if (showModal) return <AdminCodeModal onVerified={() => setShowModal(false)} />
  if (!ok) return <div>Access denied</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-2xl">VIVENTA Master Admin</div>
          <nav className="space-x-4 flex items-center">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} className={`text-sm px-3 py-1 rounded ${tab === t ? 'bg-[#00A6A6] text-white' : 'hover:bg-gray-200'}`}>{t}</button>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
  {tab === 'Dashboard' && <DashboardKPIs stats={stats} />}
           {tab === 'Listings' && <ListingsModeration />}
           {tab === 'Users' && <UsersManagement />}
           {tab === 'Brokerages' && <BrokeragesManagement />}
           {tab === 'Applications' && <ApplicationsQueue />}
           {tab === 'Audit Logs' && <AuditLogs />}
           {tab === 'Clients & CRM' && <CRMClients />}
           {tab === 'Inbox' && <InboxSupport />}
           {tab === 'Settings' && <SettingsPage />}
           {tab === 'Billing' && <BillingPage />}
  {/* TODO: Add tab content components for Users, Brokerages, etc. */}
      </main>
    </div>
  )
}
import UsersManagement from './UsersManagement'
import BrokeragesManagement from './BrokeragesManagement'
import ApplicationsQueue from './ApplicationsQueue'
import AuditLogs from './AuditLogs'
import CRMClients from './CRMClients'
import InboxSupport from './InboxSupport'
import SettingsPage from './SettingsPage'
import BillingPage from './BillingPage'

function DashboardKPIs({ stats }: { stats: any }) {
  return (
    <div className="grid md:grid-cols-5 gap-6">
      <KPIWidget label="Listings" value={stats.listings} />
      <KPIWidget label="Agents" value={stats.agents} />
      <KPIWidget label="Invites" value={stats.invites} />
      <KPIWidget label="Leads" value={stats.leads} />
      <KPIWidget label="Searches" value={stats.searches} />
    </div>
  )
}

function KPIWidget({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-white rounded shadow p-6 flex flex-col items-center justify-center">
      <div className="text-3xl font-bold text-[#004AAD]">{value}</div>
      <div className="mt-2 text-gray-600 text-sm">{label}</div>
    </div>
  )
}
