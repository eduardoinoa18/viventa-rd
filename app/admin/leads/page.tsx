// app/admin/leads/page.tsx
'use client'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { FiTarget, FiInfo } from 'react-icons/fi'
import { useEffect, useMemo, useState } from 'react'

export default function AdminLeadsPage() {
  const [loading, setLoading] = useState(true)
  const [leads, setLeads] = useState<any[]>([])
  const [assigning, setAssigning] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState<string>('')
  const [loadingCandidates, setLoadingCandidates] = useState(false)
  const [filter, setFilter] = useState<'all'|'unassigned'|'assigned'>('all')

  async function loadLeads() {
    try {
      setLoading(true)
      
      // Fetch leads from API (server-side with Admin SDK)
      const res = await fetch('/api/admin/leads?limit=100')
      if (!res.ok) {
        throw new Error('Failed to fetch leads')
      }
      
      const data = await res.json()
      if (data.ok && data.leads) {
        // Parse date strings back to Date objects for display
        const parsedLeads = data.leads.map((lead: any) => ({
          ...lead,
          createdAt: lead.createdAt ? new Date(lead.createdAt) : new Date()
        }))
        setLeads(parsedLeads)
      } else {
        setLeads([])
      }
    } catch (e) {
      console.error('Failed to load leads:', e)
      setLeads([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLeads() }, [])

  async function openAssign(leadId: string) {
    setAssigning(leadId)
    setSelectedAssignee('')
    setLoadingCandidates(true)
    try {
      // Fetch agents and brokers
      const [agentsRes, brokersRes] = await Promise.all([
        fetch('/api/admin/users?role=agent').then(r => r.json()).catch(() => ({ ok: false })),
        fetch('/api/admin/users?role=broker').then(r => r.json()).catch(() => ({ ok: false })),
      ])
      const a = agentsRes?.ok ? agentsRes.data : []
      const b = brokersRes?.ok ? brokersRes.data : []
      // sort by status and name
      const all = [...a, ...b].sort((x: any, y: any) => String(x.name||'').localeCompare(String(y.name||'')))
      setCandidates(all)
    } finally {
      setLoadingCandidates(false)
    }
  }

  async function assign() {
    if (!assigning || !selectedAssignee) return
    try {
      // Find the lead and its source
      const lead = leads.find(l => l.id === assigning)
      if (!lead) return
      
      const res = await fetch('/api/admin/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: assigning, source: lead.source, assignedTo: selectedAssignee })
      })
      if (!res.ok) throw new Error('Failed to assign lead')
      
      // reflect locally
      const profile = candidates.find(c => c.id === selectedAssignee)
      setLeads(prev => prev.map(l => l.id === assigning ? {
        ...l,
        status: 'assigned',
        assignedTo: { uid: profile?.id, name: profile?.name || profile?.company || '—', role: profile?.role, email: profile?.email },
        assignedAt: new Date()
      } : l))
      setAssigning(null)
      setSelectedAssignee('')
    } catch (e) {
      alert('No se pudo asignar el lead')
    }
  }

  const visibleLeads = leads.filter(l => {
    if (filter === 'all') return true
    const isAssigned = l.status === 'assigned' && !!l.assignedTo
    return filter === 'assigned' ? isAssigned : !isAssigned
  })

  const kpis = useMemo(() => {
    const now = Date.now()
    const ms24h = 24 * 60 * 60 * 1000
    const toMillis = (ts: any) => ts?.toDate?.()?.getTime?.() ?? (typeof ts === 'number' ? ts : undefined)
    const new24 = leads.filter(l => {
      const c = toMillis(l.createdAt)
      return !!c && (now - c) <= ms24h
    }).length
    const unassigned = leads.filter(l => !(l.status === 'assigned' && l.assignedTo)).length
    const assignedWithTimes = leads
      .map(l => ({ c: toMillis(l.createdAt), a: toMillis(l.assignedAt) }))
      .filter(x => x.c && x.a)
    const avgMs = assignedWithTimes.length
      ? Math.round(assignedWithTimes.reduce((sum, x) => sum + (x.a! - x.c!), 0) / assignedWithTimes.length)
      : null
    const avgHours = avgMs != null ? (avgMs / (60 * 60 * 1000)) : null
    return { new24, unassigned, avgHours }
  }, [leads])

  return (
    <ProtectedClient allowed={['master_admin','admin']}>
      <AdminTopbar />
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-[#0B2545] inline-flex items-center gap-3">
                <FiTarget /> Leads
              </h1>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-blue-50 text-blue-600"><FiInfo /></div>
                <div>
                  <h2 className="text-xl font-semibold text-[#0B2545] mb-1">Gestión de Leads Consolidada</h2>
                  <p className="text-gray-600 mb-4">
                    Aquí aparecen <strong>todos los leads</strong> generados desde múltiples fuentes:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li><strong>Consultas de Propiedades:</strong> Usuarios interesados en propiedades específicas</li>
                    <li><strong>Formulario de Contacto:</strong> Solicitudes generales de información y ayuda</li>
                    <li><strong>Waitlist Social:</strong> Usuarios interesados en la red social (fase beta)</li>
                  </ul>
                  <p className="text-gray-600 mt-4">
                    💡 <strong>Próximos pasos:</strong> Asigna leads manualmente a agentes activos o usa el botón &quot;Auto-asignar&quot; para distribución inteligente.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="text-sm text-gray-500">Leads nuevos (24h)</div>
                  <div className="text-2xl font-bold text-[#0B2545]">{kpis.new24}</div>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="text-sm text-gray-500">En espera de asignación</div>
                  <div className="text-2xl font-bold text-[#0B2545]">{kpis.unassigned}</div>
                </div>
                <div className="p-4 rounded-lg border bg-gray-50">
                  <div className="text-sm text-gray-500">Tiempo respuesta prom.</div>
                  <div className="text-2xl font-bold text-[#0B2545]">{kpis.avgHours == null ? '—' : `${kpis.avgHours.toFixed(1)}h`}</div>
                </div>
              </div>

              {/* Read-only recent inquiries list */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-[#0B2545] mb-3">Consultas recientes</h3>
                <div className="rounded-lg border overflow-hidden bg-white">
                  <div className="flex items-center justify-between p-3 border-b bg-gray-50">
                    <div className="flex items-center gap-2 text-sm">
                      <button onClick={()=>setFilter('all')} className={`px-3 py-1.5 rounded ${filter==='all'?'bg-[#00A6A6] text-white':'text-gray-700 hover:bg-gray-100'}`}>Todas</button>
                      <button onClick={()=>setFilter('unassigned')} className={`px-3 py-1.5 rounded ${filter==='unassigned'?'bg-[#00A6A6] text-white':'text-gray-700 hover:bg-gray-100'}`}>Sin asignar</button>
                      <button onClick={()=>setFilter('assigned')} className={`px-3 py-1.5 rounded ${filter==='assigned'?'bg-[#00A6A6] text-white':'text-gray-700 hover:bg-gray-100'}`}>Asignadas</button>
                    </div>
                    <div>
                      <button onClick={loadLeads} className="px-3 py-1.5 rounded border text-[#0B2545] border-gray-300 hover:bg-gray-100">Actualizar</button>
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3">Source</th>
                        <th className="text-left p-3">Cliente</th>
                        <th className="text-left p-3">Detalles</th>
                        <th className="text-left p-3">Fecha</th>
                        <th className="text-left p-3">Estado</th>
                        <th className="text-left p-3">Asignación</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {loading ? (
                        <tr><td colSpan={6} className="p-4 text-center text-gray-500">Cargando...</td></tr>
                      ) : visibleLeads.length === 0 ? (
                        <tr><td colSpan={6} className="p-6 text-center text-gray-500">No hay leads en esta vista</td></tr>
                      ) : (
                        visibleLeads.map((l) => (
                          <tr key={l.id}>
                            <td className="p-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                l.source === 'property_inquiry' ? 'bg-green-100 text-green-800' :
                                l.source === 'contact_form' ? 'bg-blue-100 text-blue-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {l.source === 'property_inquiry' ? '🏠 Propiedad' :
                                 l.source === 'contact_form' ? '📧 Contacto' :
                                 '👥 Waitlist'}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-medium text-[#0B2545]">{l.name}</div>
                              <div className="text-gray-500 text-sm">{l.email}</div>
                              <div className="text-gray-500 text-xs">{l.phone}</div>
                            </td>
                            <td className="p-3">
                              {l.source === 'property_inquiry' ? (
                                <>
                                  <div className="font-medium text-sm">{l.propertyTitle || 'Property'}</div>
                                  <div className="text-gray-500 text-xs">Contacto: {l.preferredContact || 'email'}</div>
                                </>
                              ) : (
                                <div className="text-sm text-gray-600 line-clamp-2">{l.message?.substring(0, 100) || 'Sin mensaje'}</div>
                              )}
                            </td>
                            <td className="p-3 text-sm">{l.createdAt?.toDate?.()?.toLocaleString?.('es-DO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) || '—'}</td>
                            <td className="p-3">
                              <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">{l.status || 'new'}</span>
                            </td>
                            <td className="p-3">
                              {l.status === 'assigned' && l.assignedTo ? (
                                <span className="px-2 py-1 rounded bg-green-100 text-green-800 text-xs">
                                  {l.assignedTo.name} ({l.assignedTo.role})
                                </span>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => openAssign(l.id)} className="px-3 py-1.5 rounded border text-[#0B2545] border-gray-300 hover:bg-gray-50">Asignar</button>
                                  <button onClick={async ()=>{
                                    try{
                                      const res = await fetch('/api/admin/leads/auto-assign',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ leadId: l.id })})
                                      const j = await res.json()
                                      if(!res.ok || !j.ok) throw new Error(j.error||'fail')
                                      setLeads(prev => prev.map(x => x.id===l.id ? { ...x, status:'assigned', assignedTo: j.assignee } : x))
                                    }catch(e){
                                      alert('No se pudo auto-asignar')
                                    }
                                  }} className="px-3 py-1.5 rounded border text-[#0B2545] border-gray-300 hover:bg-gray-50">Auto-asignar</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assign modal */}
              {assigning && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                    <div className="text-xl font-bold text-[#0B2545] mb-4">Asignar Lead</div>
                    <div className="mb-3 text-sm text-gray-600">Selecciona un agente o bróker para este lead.</div>
                    <div className="mb-4">
                      {loadingCandidates ? (
                        <div className="text-gray-500">Cargando candidatos...</div>
                      ) : candidates.length === 0 ? (
                        <div className="text-gray-500">No hay candidatos disponibles</div>
                      ) : (
                        <select value={selectedAssignee} onChange={e=>setSelectedAssignee(e.target.value)} className="w-full px-3 py-2 border rounded" aria-label="Select professional to assign lead">
                          <option value="">Selecciona profesional</option>
                          {candidates.map(c => (
                            <option key={c.id} value={c.id}>{c.role === 'broker' ? 'Broker' : 'Agente'} — {c.name || c.company} {c.status !== 'active' ? '(pendiente)' : ''}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setAssigning(null)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancelar</button>
                      <button onClick={assign} disabled={!selectedAssignee} className="px-4 py-2 bg-[#00A676] text-white rounded disabled:opacity-50">Asignar</button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
