'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiClock, FiX } from 'react-icons/fi'

type LeadStage = 'new' | 'assigned' | 'contacted' | 'qualified' | 'negotiating' | 'won' | 'lost' | 'archived'

interface LeadRecord {
  id: string
  buyerName: string
  buyerEmail: string
  buyerPhone?: string
  type: 'request-info' | 'request-call' | 'whatsapp' | 'showing'
  source: string
  sourceId?: string
  status: 'unassigned' | 'assigned' | 'contacted' | 'won' | 'lost'
  leadStage: LeadStage
  ownerAgentId?: string | null
  assignedTo?: string | null
  inboxConversationId?: string
  createdAt: string
  updatedAt: string
  slaBreached?: boolean
  secondsToBreach?: number | null
}

interface LeadStats {
  total: number
  overdue: number
  unowned: number
  byStage: Record<LeadStage, number>
}

const STAGE_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
  new: ['assigned', 'lost', 'archived'],
  assigned: ['contacted', 'lost', 'archived'],
  contacted: ['qualified', 'lost', 'archived'],
  qualified: ['negotiating', 'lost', 'archived'],
  negotiating: ['won', 'lost', 'archived'],
  won: ['archived'],
  lost: ['archived'],
  archived: [],
}

function formatSla(secondsToBreach: number | null | undefined) {
  if (secondsToBreach === null || secondsToBreach === undefined) return '—'
  const isOverdue = secondsToBreach < 0
  const abs = Math.abs(secondsToBreach)
  const hours = Math.floor(abs / 3600)
  const minutes = Math.floor((abs % 3600) / 60)
  const suffix = isOverdue ? 'overdue' : 'left'
  return `${hours}h ${minutes}m ${suffix}`
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [stats, setStats] = useState<LeadStats>({
    total: 0,
    overdue: 0,
    unowned: 0,
    byStage: {
      new: 0,
      assigned: 0,
      contacted: 0,
      qualified: 0,
      negotiating: 0,
      won: 0,
      lost: 0,
      archived: 0,
    },
  })
  const [loading, setLoading] = useState(true)
  const [selectedStage, setSelectedStage] = useState<LeadStage | null>('new')
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [agents, setAgents] = useState<Array<{ id: string; name: string; company?: string }>>([])
  const [agentsLoading, setAgentsLoading] = useState(false)
  const [assignNote, setAssignNote] = useState('')

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      const url = selectedStage
        ? `/api/admin/leads/queue?stage=${encodeURIComponent(selectedStage)}&limit=100`
        : '/api/admin/leads/queue?limit=100'

      const res = await fetch(url)
      const data = await res.json()

      if (data.ok) {
        setLeads(data.data.leads || [])
        setStats(data.data.stats || stats)
      } else {
        toast.error(data.error || 'Failed to fetch leads')
      }
    } catch (err) {
      console.error('Error fetching leads:', err)
      toast.error('Error fetching leads')
    } finally {
      setLoading(false)
    }
  }, [selectedStage])

  const fetchAgents = useCallback(async () => {
    try {
      setAgentsLoading(true)
      const res = await fetch('/api/admin/users?role=agent&limit=200')
      const data = await res.json()

      if (data.ok && Array.isArray(data.data)) {
        setAgents(data.data)
      } else {
        toast.error('Failed to load agents')
      }
    } catch (err) {
      console.error('Error fetching agents:', err)
      toast.error('Error loading agents')
    } finally {
      setAgentsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [selectedStage, fetchLeads])

  const handleAssign = async (agentId: string) => {
    if (!selectedLeadId) return

    try {
      const res = await fetch('/api/admin/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          agentId,
          note: assignNote || undefined,
        }),
      })

      const data = await res.json()
      if (data.ok) {
        toast.success('Lead assigned successfully')
        setShowAssignModal(false)
        setSelectedLeadId(null)
        setAssignNote('')
        fetchLeads()
      } else {
        toast.error(data.error || 'Failed to assign lead')
      }
    } catch (err) {
      console.error('Error assigning lead:', err)
      toast.error('Error assigning lead')
    }
  }

  const handleStageChange = async (lead: LeadRecord, nextStage: LeadStage) => {
    try {
      const res = await fetch('/api/admin/leads/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: lead.id,
          leadStage: nextStage,
        }),
      })

      const data = await res.json()
      if (data.ok) {
        toast.success('Lead stage updated')
        fetchLeads()
      } else {
        toast.error(data.error || 'Failed to update stage')
      }
    } catch (err) {
      console.error('Error updating stage:', err)
      toast.error('Error updating stage')
    }
  }

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return

    try {
      const res = await fetch('/api/admin/leads/queue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId }),
      })

      const data = await res.json()
      if (data.ok) {
        toast.success('Lead deleted')
        fetchLeads()
      } else {
        toast.error(data.error || 'Failed to delete lead')
      }
    } catch (err) {
      console.error('Error deleting lead:', err)
      toast.error('Error deleting lead')
    }
  }

  const openAssignModal = (leadId: string) => {
    setSelectedLeadId(leadId)
    fetchAgents()
    setShowAssignModal(true)
  }

  const stageColor: Record<LeadStage, string> = {
    new: 'bg-yellow-100 text-yellow-800',
    assigned: 'bg-blue-100 text-blue-800',
    contacted: 'bg-purple-100 text-purple-800',
    qualified: 'bg-indigo-100 text-indigo-800',
    negotiating: 'bg-cyan-100 text-cyan-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Lead Queue Management</h1>
        <button
          onClick={() => fetchLeads()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div
          className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setSelectedStage(null)}
        >
          <div className="text-sm text-gray-600">Total Leads</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Overdue SLA</div>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Unowned</div>
          <div className="text-2xl font-bold text-amber-600">{stats.unowned}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {(Object.keys(stats.byStage) as LeadStage[]).map((stage) => (
          <button
            key={stage}
            onClick={() => setSelectedStage(stage)}
            className={`p-3 rounded-lg border text-left transition ${selectedStage === stage ? 'border-[#00A676] ring-2 ring-[#00A676]/30' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="text-xs text-gray-600 capitalize">{stage}</div>
            <div className="text-xl font-bold text-gray-900">{stats.byStage[stage]}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">SLA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading leads...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No leads found</td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const options = [lead.leadStage, ...STAGE_TRANSITIONS[lead.leadStage]]
                  const owner = lead.ownerAgentId || lead.assignedTo || ''
                  return (
                    <tr key={lead.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{lead.buyerName}</div>
                        <div className="text-xs text-gray-500">{lead.source}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-600">
                          <div>{lead.buyerEmail}</div>
                          {lead.buyerPhone && <div>{lead.buyerPhone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={lead.leadStage}
                          onChange={(e) => handleStageChange(lead, e.target.value as LeadStage)}
                          className={`text-xs font-medium px-3 py-1 rounded-full cursor-pointer border-none ${stageColor[lead.leadStage]}`}
                          aria-label={`Change stage for ${lead.buyerName}`}
                        >
                          {options.map((stage) => (
                            <option key={stage} value={stage}>
                              {stage}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700">
                        {owner || <span className="text-amber-700">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1 text-xs font-medium ${lead.slaBreached ? 'text-red-700' : 'text-gray-700'}`}>
                          <FiClock /> {formatSla(lead.secondsToBreach)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        {!owner && (
                          <button
                            onClick={() => openAssignModal(lead.id)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                          >
                            Assign
                          </button>
                        )}
                        {lead.inboxConversationId && (
                          <button
                            onClick={() => router.push(`/master/inbox?conv=${lead.inboxConversationId}`)}
                            className="inline-flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100"
                          >
                            Chat
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLead(lead.id)}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Assign Lead to Agent</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedLeadId(null)
                  setAssignNote('')
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close assign modal"
                title="Close"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Agent</label>
                {agentsLoading ? (
                  <div className="text-sm text-gray-500">Loading agents...</div>
                ) : agents.length === 0 ? (
                  <div className="text-sm text-red-600">No agents available</div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {agents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => handleAssign(agent.id)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                      >
                        <div className="font-medium text-gray-900">{agent.name}</div>
                        {agent.company && <div className="text-xs text-gray-600">{agent.company}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason / Note</label>
                <textarea
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="Assignment context or reassignment reason..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
