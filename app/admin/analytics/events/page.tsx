// app/admin/analytics/events/page.tsx
'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import Card from '@/components/ui/Card'
import { FiActivity, FiUsers, FiTrendingUp, FiPieChart, FiBarChart2, FiEye, FiSearch, FiHeart, FiFileText, FiAlertCircle } from 'react-icons/fi'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface AnalyticsSummary {
  totalEvents: number
  uniqueUsers: number
  dau: number
  wau: number
  mau: number
  signups: {
    agent: number
    broker: number
    user: number
    total: number
  }
  listings: {
    created: number
    viewed: number
  }
  engagement: {
    searches: number
    favorites: number
    leads: number
  }
  errors: number
}

interface AnalyticsTrends {
  dauTrend: Array<{ date: string; users: number }>
  topEvents: Array<{ eventType: string; count: number }>
  userRoleCounts: Record<string, number>
}

export default function AnalyticsEventsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null)
  const [trends, setTrends] = useState<AnalyticsTrends | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  async function fetchAnalytics() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/analytics/events?range=${timeRange}`)
      const result = await res.json()
      if (result.ok) {
        setSummary(result.data.summary)
        setTrends(result.data.trends)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  return (
    <ProtectedClient allowed={['master_admin', 'admin']}>
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <AdminTopbar />
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#0B2545] flex items-center gap-3">
                    <FiActivity className="text-[#00A676]" />
                    Analytics Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Real-time event tracking and user behavior analytics
                  </p>
                </div>
                <div className="flex gap-2">
                  {(['7d', '30d', '90d'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        timeRange === range
                          ? 'bg-[#00A676] text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                      }`}
                    >
                      {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00A676] mx-auto"></div>
                  <p className="text-gray-600 mt-4">Loading analytics...</p>
                </div>
              ) : summary && trends ? (
                <div className="space-y-6">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Daily Active Users</p>
                          <p className="text-3xl font-bold text-[#0B2545] mt-1">{summary.dau}</p>
                          <p className="text-xs text-gray-500 mt-1">WAU: {summary.wau} | MAU: {summary.mau}</p>
                        </div>
                        <FiUsers className="text-4xl text-[#00A676]" />
                      </div>
                    </Card>

                    <Card>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Events</p>
                          <p className="text-3xl font-bold text-[#0B2545] mt-1">{summary.totalEvents.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-1">Unique users: {summary.uniqueUsers}</p>
                        </div>
                        <FiActivity className="text-4xl text-blue-500" />
                      </div>
                    </Card>

                    <Card>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">New Signups</p>
                          <p className="text-3xl font-bold text-[#0B2545] mt-1">{summary.signups.total}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            A: {summary.signups.agent} | B: {summary.signups.broker} | U: {summary.signups.user}
                          </p>
                        </div>
                        <FiTrendingUp className="text-4xl text-green-500" />
                      </div>
                    </Card>

                    <Card>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Listings Created</p>
                          <p className="text-3xl font-bold text-[#0B2545] mt-1">{summary.listings.created}</p>
                          <p className="text-xs text-gray-500 mt-1">Views: {summary.listings.viewed.toLocaleString()}</p>
                        </div>
                        <FiFileText className="text-4xl text-purple-500" />
                      </div>
                    </Card>
                  </div>

                  {/* Engagement Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <div className="flex items-center gap-3">
                        <FiSearch className="text-2xl text-[#00A676]" />
                        <div>
                          <p className="text-sm text-gray-600">Searches</p>
                          <p className="text-2xl font-bold text-[#0B2545]">{summary.engagement.searches}</p>
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="flex items-center gap-3">
                        <FiHeart className="text-2xl text-red-500" />
                        <div>
                          <p className="text-sm text-gray-600">Favorites</p>
                          <p className="text-2xl font-bold text-[#0B2545]">{summary.engagement.favorites}</p>
                        </div>
                      </div>
                    </Card>
                    <Card>
                      <div className="flex items-center gap-3">
                        <FiEye className="text-2xl text-blue-500" />
                        <div>
                          <p className="text-sm text-gray-600">Leads Created</p>
                          <p className="text-2xl font-bold text-[#0B2545]">{summary.engagement.leads}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* DAU Trend Chart */}
                  <Card title="Daily Active Users Trend" description="User activity over the last 7 days">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trends.dauTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="#00A676" strokeWidth={2} name="Active Users" />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Top Events */}
                  <Card title="Top Events" description="Most frequent event types in this period">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={trends.topEvents.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="eventType" tickFormatter={formatEventType} angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip labelFormatter={formatEventType} />
                        <Bar dataKey="count" fill="#00A676" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Error Tracking */}
                  {summary.errors > 0 && (
                    <Card>
                      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                        <FiAlertCircle className="text-3xl text-red-500" />
                        <div>
                          <p className="font-semibold text-red-900">Error Events Detected</p>
                          <p className="text-sm text-red-700">
                            {summary.errors} error{summary.errors !== 1 ? 's' : ''} tracked in the selected period. 
                            Review error logs for details.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              ) : (
                <Card>
                  <div className="text-center py-12">
                    <FiPieChart className="text-6xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No analytics data available yet</p>
                    <p className="text-sm text-gray-500 mt-2">Events will appear here as users interact with the platform</p>
                  </div>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedClient>
  )
}
