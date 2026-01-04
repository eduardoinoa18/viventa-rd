// app/admin/email/events/page.tsx
'use client'
import { useEffect, useState } from 'react'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import Card from '@/components/ui/Card'
import { FiMail, FiRefreshCw, FiFilter } from 'react-icons/fi'

interface EmailEvent {
  id: string
  provider: string
  eventType: string
  to: string | null
  subject: string | null
  timestamp: string
}

const ranges = [
  { key: '24h', label: 'Last 24h' },
  { key: '7d', label: 'Last 7d' },
  { key: '30d', label: 'Last 30d' },
 ] as const

export default function AdminEmailEventsPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<EmailEvent[]>([])
  const [range, setRange] = useState<'24h' | '7d' | '30d'>('24h')
  const [provider, setProvider] = useState<'all' | 'sendgrid' | 'smtp'>('all')
  const [type, setType] = useState<'all' | 'sent' | 'delivered' | 'opened' | 'bounced' | 'complaint' | 'unknown'>('all')

  useEffect(() => { fetchEvents() }, [range])

  async function fetchEvents() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/email/events?range=${range}&limit=100`)
      const json = await res.json()
      if (json.ok) {
        const mapped: EmailEvent[] = json.data.map((d: any) => ({
          id: d.id,
          provider: d.provider,
          eventType: d.eventType,
          to: d.to || null,
          subject: d.subject || null,
          timestamp: new Date(d.timestamp).toISOString(),
        }))
        setItems(mapped)
      } else {
        setItems([])
      }
    } catch (e) {
      console.error('Failed to load email events', e)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = items.filter((i) => (provider === 'all' || i.provider === provider) && (type === 'all' || i.eventType === type))

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString()
  }

  return (
    <ProtectedClient allowed={['master_admin', 'admin']}>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FiMail className="text-3xl text-[#00A676]" />
                  <div>
                    <h1 className="text-2xl font-bold text-[#0B2545]">Email Delivery</h1>
                    <p className="text-gray-600">Recent email events from all providers</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {ranges.map(r => (
                    <button
                      key={r.key}
                      onClick={() => setRange(r.key)}
                      className={`px-3 py-2 rounded-md text-sm font-medium ${range === r.key ? 'bg-[#00A676] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                    >{r.label}</button>
                  ))}
                  <button onClick={fetchEvents} className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                    <FiRefreshCw /> Refresh
                  </button>
                </div>
              </div>

              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <FiFilter className="text-gray-500" />
                  <label htmlFor="provider" className="sr-only">Provider</label>
                  <select id="provider" aria-label="Provider" value={provider} onChange={(e) => setProvider(e.target.value as any)} className="border rounded-md px-2 py-1">
                    <option value="all">All Providers</option>
                    <option value="sendgrid">SendGrid</option>
                    <option value="smtp">SMTP</option>
                  </select>
                  <label htmlFor="eventType" className="sr-only">Event Type</label>
                  <select id="eventType" aria-label="Event Type" value={type} onChange={(e) => setType(e.target.value as any)} className="border rounded-md px-2 py-1">
                    <option value="all">All Types</option>
                    <option value="sent">Sent</option>
                    <option value="delivered">Delivered</option>
                    <option value="opened">Opened</option>
                    <option value="bounced">Bounced</option>
                    <option value="complaint">Complaint</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full border divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Time</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Provider</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Type</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">To</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Subject</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {loading ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading...</td></tr>
                      ) : filtered.length === 0 ? (
                        <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">No email events in this range</td></tr>
                      ) : (
                        filtered.map((e) => (
                          <tr key={e.id}>
                            <td className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap">{formatDate(e.timestamp)}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{e.provider}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{e.eventType}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{e.to || '-'}</td>
                            <td className="px-4 py-2 text-sm text-gray-700 max-w-[420px] truncate">{e.subject || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </ProtectedClient>
  )
}
