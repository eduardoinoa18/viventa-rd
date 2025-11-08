'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '@/lib/authSession'
import ProfessionalSidebar from '@/components/ProfessionalSidebar'
import { FiCalendar, FiClock, FiMapPin, FiPlus, FiTrash2 } from 'react-icons/fi'
import toast from 'react-hot-toast'

interface EventItem {
  id: string
  title: string
  date: string
  time?: string
  type: 'showing' | 'meeting' | 'closing' | 'other'
  location?: string
}

export default function AgentCalendarPage() {
  const [user, setUser] = useState<any>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', type: 'showing' as EventItem['type'], location: '' })
  const router = useRouter()

  useEffect(() => {
    const s = getSession()
    if (!s || s.role !== 'agent') { router.replace('/agent/login'); return }
    setUser(s)
    ;(async () => {
      try {
        const res = await fetch('/api/agent/events')
        const data = await res.json()
        if (data.ok) setEvents(data.events)
      } catch {}
    })()
  }, [])

  async function createEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.date) return
    setSaving(true)
    try {
      const res = await fetch('/api/agent/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.ok) {
        const r = await fetch('/api/agent/events')
        const d = await r.json()
        if (d.ok) setEvents(d.events)
        setShowCreate(false)
        setForm({ title: '', date: '', time: '', type: 'showing', location: '' })
        toast.success('Evento creado exitosamente')
      } else {
        toast.error('Error al crear evento')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function deleteEvent(eventId: string) {
    if (!confirm('¿Eliminar este evento?')) return
    try {
      const res = await fetch(`/api/agent/events?id=${eventId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId))
        toast.success('Evento eliminado')
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  if (!user) return null

  return (
    <div className='flex min-h-screen bg-gray-50'>
      <ProfessionalSidebar role='agent' userName={user.name} professionalCode={user.professionalCode || user.agentCode} />
      <main className='flex-1 p-6'>
        <div className='max-w-6xl mx-auto'>
          <div className='flex flex-wrap justify-between items-center mb-8 gap-4'>
            <div>
              <h1 className='text-3xl font-bold text-[#0B2545] mb-2'>Mi Agenda</h1>
              <p className='text-gray-600'>Gestiona tus visitas, reuniones y actividades</p>
            </div>
            <button onClick={() => setShowCreate(true)} className='px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] inline-flex items-center gap-2'>
              <FiPlus /> Nuevo Evento
            </button>
          </div>

          <div className='grid md:grid-cols-2 gap-6'>
            {/* Upcoming Events */}
            <div className='bg-white rounded-xl shadow p-6'>
              <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'><FiCalendar /> Próximos Eventos</h2>
              {events.length === 0 ? (
                <p className='text-gray-500 text-sm'>No hay eventos programados</p>
              ) : (
                <div className='space-y-4'>
                  {events.map(ev => (
                    <div key={ev.id} className='border rounded-lg p-4 hover:bg-gray-50 transition'>
                      <div className='flex justify-between items-start mb-2 gap-3'>
                        <div className='flex-1 min-w-0'>
                          <div className='font-semibold text-gray-800'>{ev.title}</div>
                          <div className='text-xs text-gray-500 mt-1 flex items-center gap-2'>
                            <FiClock /> {ev.date} • {ev.time}
                          </div>
                        </div>
                        <div className='flex items-center gap-2 shrink-0'>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ev.type === 'showing' ? 'bg-blue-100 text-blue-800' : ev.type === 'meeting' ? 'bg-purple-100 text-purple-800' : ev.type === 'closing' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>{ev.type === 'showing' ? 'Visita' : ev.type === 'meeting' ? 'Reunión' : ev.type === 'closing' ? 'Cierre' : 'Otro'}</span>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            className='p-1.5 text-red-500 hover:bg-red-50 rounded'
                            aria-label='Eliminar evento'
                          >
                            <FiTrash2 className='text-sm' />
                          </button>
                        </div>
                      </div>
                      {ev.location && <div className='text-sm text-gray-600 flex items-center gap-1'><FiMapPin /> {ev.location}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Placeholder Calendar Visualization */}
            <div className='bg-white rounded-xl shadow p-6'>
              <h2 className='text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2'><FiCalendar /> Calendario</h2>
              <div className='grid grid-cols-7 gap-2 text-xs'>
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className='aspect-square border rounded flex items-center justify-center bg-gray-50'>
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className='text-gray-500 text-xs mt-4'>Vista mensual simplificada. Integración completa próximamente.</p>
            </div>
          </div>
        </div>

        {showCreate && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50'>
            <form onSubmit={createEvent} className='bg-white rounded-xl shadow-lg w-full max-w-md p-6 space-y-4'>
              <h3 className='text-lg font-bold text-[#0B2545] mb-2'>Crear Evento</h3>
              <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder='Título' aria-label='Título' className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent' />
              <input required aria-label='Fecha' title='Fecha' placeholder='Selecciona fecha' type='date' value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent' />
              <input placeholder='Hora (ej: 10:00 AM)' value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent' />
              <input placeholder='Ubicación' value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent' />
              <select aria-label='Tipo de evento' title='Tipo de evento' value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as any}))} className='w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent'>
                <option value='showing'>Visita</option>
                <option value='meeting'>Reunión</option>
                <option value='closing'>Cierre</option>
                <option value='other'>Otro</option>
              </select>
              <div className='flex gap-3 pt-2'>
                <button type='button' onClick={() => setShowCreate(false)} className='flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50'>Cancelar</button>
                <button type='submit' disabled={saving} className='flex-1 px-4 py-2 bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008F64] disabled:opacity-50'>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
