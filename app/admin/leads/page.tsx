// app/admin/leads/page.tsx
'use client'
import ProtectedClient from '../../auth/ProtectedClient'
import AdminSidebar from '../../../components/AdminSidebar'
import AdminTopbar from '../../../components/AdminTopbar'
import { FiTarget, FiInfo } from 'react-icons/fi'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../../../lib/firebaseClient'
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore'

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
      const q = query(collection(db as any, 'property_inquiries'), orderBy('createdAt', 'desc'), limit(25))
      const snap = await getDocs(q as any)
      const rows = snap.docs.map((d: any) => ({ id: d.id, ...(d.data() as any) }))
      setLeads(rows)
    } catch (e) {
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
      const res = await fetch('/api/admin/leads/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: assigning, assigneeId: selectedAssignee })
      })
      if (!res.ok) throw new Error('Failed to assign lead')
      // reflect locally
      const profile = candidates.find(c => c.id === selectedAssignee)
      setLeads(prev => prev.map(l => l.id === assigning ? {
        ...l,
        status: 'assigned',
        assignedTo: { uid: profile?.id, name: profile?.name || profile?.company || '—', role: profile?.role, email: profile?.email }
      } : l))
      setAssigning(null)
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
                  <h2 className="text-xl font-semibold text-[#0B2545] mb-1">Próximamente: Asignación automática de leads</h2>
                  <p className="text-gray-600 mb-4">
                    Estamos preparando un módulo de enrutamiento inteligente de leads. Cuando un usuario solicite ayuda (por ejemplo, para comprar una propiedad), su lead
                    aparecerá aquí para revisión y asignación automática según reglas de prioridad y suscripciones premium.
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 space-y-1">
                    <li>Reglas por zona, idioma y disponibilidad</li>
                    <li>Prioridad para agentes y brokers con suscripción premium</li>
                    <li>Reasignación automática si no hay respuesta</li>
                    <li>KPIs de tiempo de respuesta y conversión</li>
                  </ul>
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
                        <th className="text-left p-3">Cliente</th>
                        <th className="text-left p-3">Propiedad</th>
                        <th className="text-left p-3">Preferencia</th>
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
                              <div className="font-medium text-[#0B2545]">{l.name}</div>
                              <div className="text-gray-500">{l.email} · {l.phone}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">{l.propertyTitle || '—'}</div>
                              <div className="text-gray-500 text-xs">{l.propertyId}</div>
                            </td>
                            <td className="p-3">{l.preferredContact || 'email'}</td>
                            <td className="p-3">{l.createdAt?.toDate?.()?.toLocaleString?.('es-DO') || '—'}</td>
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
                        <select value={selectedAssignee} onChange={e=>setSelectedAssignee(e.target.value)} className="w-full px-3 py-2 border rounded">
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

              <div className="mt-8 border-t pt-6">
                <div className="text-center text-gray-500">
                  <div className="inline-block px-4 py-2 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200">
                    Módulo en desarrollo. Pronto podrás gestionar y asignar leads desde aquí.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedClient>
  )
}
