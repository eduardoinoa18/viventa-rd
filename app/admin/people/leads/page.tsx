// app/admin/people/leads/page.tsx
'use client'
import { useState, useEffect } from 'react'
import ProtectedClient from '@/app/auth/ProtectedClient'
import AdminSidebar from '@/components/AdminSidebar'
import AdminTopbar from '@/components/AdminTopbar'
import AdminPeopleTabs from '@/components/AdminPeopleTabs'
import { FiTarget, FiUser, FiPhone, FiMail, FiCalendar, FiClock, FiArrowRight, FiX, FiCheck, FiAlertCircle, FiTrendingUp, FiFilter } from 'react-icons/fi'

type LeadSource = 'property_inquiry' | 'contact_form' | 'social_waitlist'
type LeadStatus = 'new' | 'assigned' | 'contacted' | 'qualified' | 'converted' | 'lost'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  message: string
  source: LeadSource
  status?: LeadStatus
  propertyTitle?: string
  propertyId?: string
  assignedTo?: {
    uid: string
    name: string
    role: string
    email: string
  }
  assignedAt?: string
  createdAt: string
  updatedAt?: string
}

interface Agent {
  id: string
  name: string
  email: string
  role: string
}

export default function PeopleLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | LeadStatus>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | LeadSource>('all')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchLeads()
    fetchAgents()
  }, [])

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/admin/leads')
      const data = await res.json()
      if (data.ok) {
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (data.ok) {
        const agentUsers = data.users.filter((u: any) => 
          u.role === 'agent' || u.role === 'broker' || u.role === 'admin'
        )
        setAgents(agentUsers)
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const handleAssignLead = async (leadId: string, assigneeId: string) => {
    try {
      const res = await fetch('/api/admin/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, assigneeId })
      })
      const data = await res.json()
      if (data.ok) {
        await fetchLeads()
        setAssignModalOpen(false)
        setSelectedLead(null)
      }
    } catch (error) {
      console.error('Error assigning lead:', error)
    }
  }

  const handleStatusChange = async (leadId: string, source: LeadSource, newStatus: LeadStatus) => {
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, source, status: newStatus })
      })
      const data = await res.json()
      if (data.ok) {
        await fetchLeads()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesStatus = filter === 'all' || (lead.status || 'new') === filter
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter
    const matchesSearch = !searchTerm || 
      lead.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone?.includes(searchTerm)
    return matchesStatus && matchesSource && matchesSearch
  })

  const getSourceLabel = (source: LeadSource) => {
    const labels = {
      property_inquiry: 'Property Inquiry',
      contact_form: 'Contact Form',
      social_waitlist: 'Social Waitlist'
    }
    return labels[source] || source
  }

  const getSourceColor = (source: LeadSource) => {
    const colors = {
      property_inquiry: 'bg-blue-100 text-blue-700',
      contact_form: 'bg-green-100 text-green-700',
      social_waitlist: 'bg-purple-100 text-purple-700'
    }
    return colors[source] || 'bg-gray-100 text-gray-700'
  }

  const getStatusColor = (status: LeadStatus = 'new') => {
    const colors = {
      new: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      assigned: 'bg-blue-100 text-blue-700 border-blue-200',
      contacted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      qualified: 'bg-purple-100 text-purple-700 border-purple-200',
      converted: 'bg-green-100 text-green-700 border-green-200',
      lost: 'bg-red-100 text-red-700 border-red-200'
    }
    return colors[status]
  }

  const stats = {
    total: leads.length,
    new: leads.filter(l => (l.status || 'new') === 'new').length,
    assigned: leads.filter(l => l.status === 'assigned').length,
    converted: leads.filter(l => l.status === 'converted').length,
    conversionRate: leads.length > 0 ? ((leads.filter(l => l.status === 'converted').length / leads.length) * 100).toFixed(1) : '0'
  }

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 bg-gray-50">
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#0B2545]">People</h1>
              <p className="text-gray-600">Manage users, agents, brokers, leads, and applications</p>
            </div>
          </div>

          <AdminPeopleTabs />

          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Leads</p>
                      <p className="text-2xl font-bold text-[#0B2545]">{stats.total}</p>
                    </div>
                    <FiTarget className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">New</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.new}</p>
                    </div>
                    <FiAlertCircle className="w-8 h-8 text-yellow-400" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Assigned</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
                    </div>
                    <FiUser className="w-8 h-8 text-blue-400" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Converted</p>
                      <p className="text-2xl font-bold text-green-600">{stats.converted}</p>
                    </div>
                    <FiCheck className="w-8 h-8 text-green-400" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Conversion Rate</p>
                      <p className="text-2xl font-bold text-[#00A676]">{stats.conversionRate}%</p>
                    </div>
                    <FiTrendingUp className="w-8 h-8 text-[#00A676]" />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <FiFilter className="text-gray-400" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as any)}
                      aria-label="Filter by status"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                    >
                      <option value="all">All Status</option>
                      <option value="new">New</option>
                      <option value="assigned">Assigned</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="converted">Converted</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value as any)}
                      aria-label="Filter by source"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                    >
                      <option value="all">All Sources</option>
                      <option value="property_inquiry">Property Inquiry</option>
                      <option value="contact_form">Contact Form</option>
                      <option value="social_waitlist">Social Waitlist</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Leads Table */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading leads...</div>
                ) : filteredLeads.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">No leads found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{lead.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                  <FiMail className="w-3 h-3" />
                                  {lead.email}
                                </div>
                                {lead.phone && (
                                  <div className="text-sm text-gray-500 flex items-center gap-2">
                                    <FiPhone className="w-3 h-3" />
                                    {lead.phone}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(lead.source)}`}>
                                {getSourceLabel(lead.source)}
                              </span>
                              {lead.propertyTitle && (
                                <div className="text-xs text-gray-500 mt-1">{lead.propertyTitle}</div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <select
                                value={lead.status || 'new'}
                                onChange={(e) => handleStatusChange(lead.id, lead.source, e.target.value as LeadStatus)}
                                aria-label={`Change status for ${lead.name}`}
                                className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status || 'new')} focus:outline-none focus:ring-2 focus:ring-[#00A676]`}
                              >
                                <option value="new">New</option>
                                <option value="assigned">Assigned</option>
                                <option value="contacted">Contacted</option>
                                <option value="qualified">Qualified</option>
                                <option value="converted">Converted</option>
                                <option value="lost">Lost</option>
                              </select>
                            </td>
                            <td className="px-6 py-4">
                              {lead.assignedTo ? (
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{lead.assignedTo.name}</div>
                                  <div className="text-xs text-gray-500">{lead.assignedTo.role}</div>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Unassigned</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 flex items-center gap-1">
                                <FiCalendar className="w-3 h-3" />
                                {new Date(lead.createdAt).toLocaleDateString()}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <FiClock className="w-3 h-3" />
                                {new Date(lead.createdAt).toLocaleTimeString()}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedLead(lead)
                                    setAssignModalOpen(true)
                                  }}
                                  className="text-[#00A676] hover:text-[#008F63] text-sm font-medium"
                                >
                                  {lead.assignedTo ? 'Reassign' : 'Assign'}
                                </button>
                                <button
                                  onClick={() => setSelectedLead(lead)}
                                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                >
                                  View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Assign Modal */}
      {assignModalOpen && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Assign Lead</h3>
              <button
                onClick={() => {
                  setAssignModalOpen(false)
                  setSelectedLead(null)
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close assign modal"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Assigning lead from:</p>
                <p className="font-medium text-gray-900">{selectedLead.name}</p>
                <p className="text-sm text-gray-500">{selectedLead.email}</p>
              </div>
              <div className="mb-6">
                <label htmlFor="assign-agent" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Agent/Broker
                </label>
                <select
                  id="assign-agent"
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                >
                  <option value="">Choose an agent...</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    if (selectedAgent) {
                      handleAssignLead(selectedLead.id, selectedAgent)
                    }
                  }}
                  disabled={!selectedAgent}
                  className="flex-1 bg-[#00A676] text-white px-4 py-2 rounded-lg hover:bg-[#008F63] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Assign Lead
                </button>
                <button
                  onClick={() => {
                    setAssignModalOpen(false)
                    setSelectedLead(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && !assignModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close lead details"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Name</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedLead.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900">{selectedLead.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{selectedLead.phone || 'N/A'}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Source</label>
                  <p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(selectedLead.source)}`}>
                      {getSourceLabel(selectedLead.source)}
                    </span>
                  </p>
                </div>
                {selectedLead.propertyTitle && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Property</label>
                    <p className="text-gray-900">{selectedLead.propertyTitle}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Message</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedLead.message}</p>
                </div>
                {selectedLead.assignedTo && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned To</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium text-gray-900">{selectedLead.assignedTo.name}</p>
                      <p className="text-sm text-gray-600">{selectedLead.assignedTo.email}</p>
                      <p className="text-xs text-gray-500">{selectedLead.assignedTo.role}</p>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created At</label>
                    <p className="text-gray-900">{new Date(selectedLead.createdAt).toLocaleString()}</p>
                  </div>
                  {selectedLead.assignedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Assigned At</label>
                      <p className="text-gray-900">{new Date(selectedLead.assignedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setAssignModalOpen(true)
                }}
                className="flex-1 bg-[#00A676] text-white px-4 py-2 rounded-lg hover:bg-[#008F63] transition-colors"
              >
                {selectedLead.assignedTo ? 'Reassign' : 'Assign to Agent'}
              </button>
              <button
                onClick={() => setSelectedLead(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedClient>
  )
}
