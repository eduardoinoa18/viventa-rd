'use client'

import { useEffect, useMemo, useState } from 'react'

type TeamMember = {
  id: string
  name?: string
  role?: string
  status?: string
}

type Lead = {
  id: string
  buyerName?: string
  leadStage?: string
  ownerAgentId?: string | null
  followUpAt?: string | null
  nextActionNote?: string
  priority?: 'low' | 'normal' | 'high'
}

type Task = {
  id: string
  title: string
  dueAt?: string | null
  status: string
  priority: string
}

type EventItem = {
  id: string
  title: string
  startAt?: string | null
  endAt?: string | null
  location?: string
}

export default function BrokerCrmPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [team, setTeam] = useState<TeamMember[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [assignAgentId, setAssignAgentId] = useState('')
  const [nextStage, setNextStage] = useState('contacted')
  const [followUpAt, setFollowUpAt] = useState('')
  const [nextActionNote, setNextActionNote] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueAt, setTaskDueAt] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventStartAt, setEventStartAt] = useState('')
  const [eventEndAt, setEventEndAt] = useState('')
  const [eventLocation, setEventLocation] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)

  const selectedLead = useMemo(() => leads.find((item) => item.id === selectedLeadId) || null, [leads, selectedLeadId])

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)

        const [leadsRes, teamRes, tasksRes, eventsRes] = await Promise.all([
          fetch('/api/broker/leads?limit=40', { cache: 'no-store' }),
          fetch('/api/broker/team', { cache: 'no-store' }),
          fetch('/api/broker/crm/tasks?limit=80', { cache: 'no-store' }),
          fetch('/api/broker/crm/events?limit=80', { cache: 'no-store' }),
        ])

        const [leadsJson, teamJson, tasksJson, eventsJson] = await Promise.all([
          leadsRes.json().catch(() => ({})),
          teamRes.json().catch(() => ({})),
          tasksRes.json().catch(() => ({})),
          eventsRes.json().catch(() => ({})),
        ])

        if (!active) return

        const nextLeads = Array.isArray(leadsJson?.leads) ? leadsJson.leads : []
        setLeads(nextLeads)
        if (!selectedLeadId && nextLeads[0]?.id) {
          setSelectedLeadId(nextLeads[0].id)
        }

        setTeam(Array.isArray(teamJson?.members) ? teamJson.members : [])
        setTasks(Array.isArray(tasksJson?.tasks) ? tasksJson.tasks : [])
        setEvents(Array.isArray(eventsJson?.events) ? eventsJson.events : [])
      } catch (error: any) {
        if (!active) return
        setStatus(error?.message || 'No se pudo cargar CRM')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [selectedLeadId])

  useEffect(() => {
    if (!selectedLead) {
      setFollowUpAt('')
      setNextActionNote('')
      setPriority('normal')
      return
    }

    const nextFollow = selectedLead.followUpAt ? new Date(selectedLead.followUpAt) : null
    if (nextFollow && Number.isFinite(nextFollow.getTime())) {
      const local = new Date(nextFollow.getTime() - nextFollow.getTimezoneOffset() * 60000)
      setFollowUpAt(local.toISOString().slice(0, 16))
    } else {
      setFollowUpAt('')
    }

    setNextActionNote(selectedLead.nextActionNote || '')
    setPriority(selectedLead.priority || 'normal')
    setAssignAgentId(selectedLead.ownerAgentId || '')
  }, [selectedLead?.id])

  async function runLeadAction(action: 'assign' | 'stage' | 'followup') {
    if (!selectedLeadId) {
      setStatus('Selecciona un lead.')
      return
    }

    try {
      setStatus('')
      const body: Record<string, any> = { action, leadId: selectedLeadId }

      if (action === 'assign') {
        body.ownerAgentId = assignAgentId
      }
      if (action === 'stage') {
        body.leadStage = nextStage
      }
      if (action === 'followup') {
        body.followUpAt = followUpAt ? new Date(followUpAt).toISOString() : null
        body.nextActionNote = nextActionNote
        body.priority = priority
      }

      const res = await fetch('/api/broker/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo actualizar el lead')
      }

      setStatus('Lead actualizado correctamente.')
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo actualizar el lead')
    }
  }

  async function createTask() {
    if (!taskTitle.trim()) {
      setStatus('Escribe título para la tarea.')
      return
    }

    try {
      const res = await fetch('/api/broker/crm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, dueAt: taskDueAt || null, priority: 'normal' }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo crear la tarea')
      setTaskTitle('')
      setTaskDueAt('')
      setStatus('Tarea creada.')
      const refresh = await fetch('/api/broker/crm/tasks?limit=80', { cache: 'no-store' })
      const refreshJson = await refresh.json().catch(() => ({}))
      setTasks(Array.isArray(refreshJson?.tasks) ? refreshJson.tasks : [])
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo crear la tarea')
    }
  }

  async function completeTask(id: string) {
    try {
      const res = await fetch('/api/broker/crm/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'done' }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo actualizar la tarea')
      setTasks((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'done' } : item)))
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo actualizar la tarea')
    }
  }

  async function createEvent() {
    if (!eventTitle.trim() || !eventStartAt || !eventEndAt) {
      setStatus('Completa título, inicio y fin del evento.')
      return
    }

    try {
      const res = await fetch('/api/broker/crm/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventTitle,
          startAt: new Date(eventStartAt).toISOString(),
          endAt: new Date(eventEndAt).toISOString(),
          location: eventLocation,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo crear el evento')
      setEventTitle('')
      setEventStartAt('')
      setEventEndAt('')
      setEventLocation('')
      setStatus('Evento creado.')
      const refresh = await fetch('/api/broker/crm/events?limit=80', { cache: 'no-store' })
      const refreshJson = await refresh.json().catch(() => ({}))
      setEvents(Array.isArray(refreshJson?.events) ? refreshJson.events : [])
    } catch (error: any) {
      setStatus(error?.message || 'No se pudo crear el evento')
    }
  }

  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">CRM Integrado</h2>
      {loading ? <p className="mt-2 text-sm text-gray-600">Cargando CRM...</p> : null}

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-[#0B2545]">Leads</h3>
          <div className="mt-2 space-y-2">
            <select value={selectedLeadId} onChange={(e) => setSelectedLeadId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" aria-label="Seleccionar lead CRM">
              <option value="">Seleccionar lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>{lead.buyerName || 'Lead'} • {lead.leadStage || 'new'}</option>
              ))}
            </select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select value={assignAgentId} onChange={(e) => setAssignAgentId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" aria-label="Asignar agente CRM">
                <option value="">Asignar agente</option>
                {team.filter((m) => (m.status || '').toLowerCase() === 'active').map((member) => (
                  <option key={member.id} value={member.id}>{member.name || member.id} ({member.role || 'agent'})</option>
                ))}
              </select>
              <button type="button" onClick={() => runLeadAction('assign')} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Asignar</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select value={nextStage} onChange={(e) => setNextStage(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" aria-label="Mover etapa CRM">
                <option value="assigned">assigned</option>
                <option value="contacted">contacted</option>
                <option value="qualified">qualified</option>
                <option value="negotiating">negotiating</option>
                <option value="won">won</option>
                <option value="lost">lost</option>
              </select>
              <button type="button" onClick={() => runLeadAction('stage')} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Mover etapa</button>
            </div>

            <input title="Fecha de seguimiento CRM" type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
            <textarea title="Próxima acción CRM" value={nextActionNote} onChange={(e) => setNextActionNote(e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Próxima acción" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select title="Prioridad CRM" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm">
                <option value="low">Baja</option>
                <option value="normal">Normal</option>
                <option value="high">Alta</option>
              </select>
              <button type="button" onClick={() => runLeadAction('followup')} className="px-3 py-2 rounded-lg bg-[#0B2545] text-white text-sm font-medium">Guardar follow-up</button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 p-3">
          <h3 className="text-sm font-semibold text-[#0B2545]">Tareas</h3>
          <div className="mt-2 space-y-2">
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Ej: llamar lead de Piantini" title="Título de tarea CRM" />
            <input value={taskDueAt} onChange={(e) => setTaskDueAt(e.target.value)} type="datetime-local" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Fecha de tarea CRM" />
            <button type="button" onClick={createTask} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Crear tarea</button>
            <div className="space-y-1">
              {tasks.map((task) => (
                <div key={task.id} className="rounded bg-gray-50 border border-gray-100 px-2 py-2 text-xs">
                  <div className="font-medium text-[#0B2545]">{task.title}</div>
                  <div className="text-gray-600">{task.status} {task.dueAt ? `• ${new Date(task.dueAt).toLocaleString('es-DO', { hour12: false })}` : ''}</div>
                  {task.status !== 'done' ? (
                    <button type="button" onClick={() => completeTask(task.id)} className="mt-1 text-[#0B2545] underline">Marcar done</button>
                  ) : null}
                </div>
              ))}
              {!tasks.length ? <p className="text-xs text-gray-500">Sin tareas</p> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-gray-200 p-3">
        <h3 className="text-sm font-semibold text-[#0B2545]">Calendario</h3>
        <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
          <input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm md:col-span-2" placeholder="Título del evento" title="Título del evento CRM" />
          <input value={eventStartAt} onChange={(e) => setEventStartAt(e.target.value)} type="datetime-local" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Inicio evento CRM" />
          <input value={eventEndAt} onChange={(e) => setEventEndAt(e.target.value)} type="datetime-local" className="px-3 py-2 border border-gray-200 rounded-lg text-sm" title="Fin evento CRM" />
          <input value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm md:col-span-3" placeholder="Ubicación" title="Ubicación del evento CRM" />
          <button type="button" onClick={createEvent} className="px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-[#0B2545]">Crear evento</button>
        </div>
        <div className="mt-2 space-y-1">
          {events.map((event) => (
            <div key={event.id} className="rounded bg-gray-50 border border-gray-100 px-2 py-2 text-xs">
              <div className="font-medium text-[#0B2545]">{event.title}</div>
              <div className="text-gray-600">
                {event.startAt ? new Date(event.startAt).toLocaleString('es-DO', { hour12: false }) : '—'}
                {' → '}
                {event.endAt ? new Date(event.endAt).toLocaleString('es-DO', { hour12: false }) : '—'}
                {event.location ? ` • ${event.location}` : ''}
              </div>
            </div>
          ))}
          {!events.length ? <p className="text-xs text-gray-500">Sin eventos</p> : null}
        </div>
      </div>

      {status ? <p className="mt-3 text-xs text-gray-600">{status}</p> : null}
    </section>
  )
}
