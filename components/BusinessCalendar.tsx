'use client'

import { useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiPlus, FiX, FiClock, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'

export type CalendarEvent = {
  id: string
  title: string
  date: string // ISO date string YYYY-MM-DD or full ISO
  type: 'task' | 'deal' | 'showing' | 'closing' | 'follow_up' | 'meeting' | 'other'
  status?: 'pending' | 'done' | 'overdue'
  note?: string
  priority?: 'low' | 'normal' | 'high'
}

interface BusinessCalendarProps {
  events?: CalendarEvent[]
  onAddEvent?: (date: string, title: string, type: CalendarEvent['type']) => void
  loading?: boolean
}

const TYPE_META: Record<CalendarEvent['type'], { label: string; color: string; bg: string; dot: string; border: string }> = {
  task:       { label: 'Tarea',      color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',      dot: 'bg-blue-500',    border: 'border-l-blue-500' },
  deal:       { label: 'Deal',       color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200',  dot: 'bg-purple-500',  border: 'border-l-purple-500' },
  showing:    { label: 'Visita',     color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',    dot: 'bg-amber-500',   border: 'border-l-amber-500' },
  closing:    { label: 'Cierre',     color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', border: 'border-l-emerald-500' },
  follow_up:  { label: 'Follow-up',  color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',  dot: 'bg-orange-500',  border: 'border-l-orange-500' },
  meeting:    { label: 'Reunión',    color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200',      dot: 'bg-teal-500',    border: 'border-l-teal-500' },
  other:      { label: 'Otro',       color: 'text-gray-700',    bg: 'bg-gray-50 border-gray-200',      dot: 'bg-gray-400',    border: 'border-l-gray-400' },
}

const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function parseEventDate(date: string): string {
  if (!date) return ''
  return date.slice(0, 10) // always YYYY-MM-DD
}

export default function BusinessCalendar({ events = [], onAddEvent, loading = false }: BusinessCalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(toDateKey(today))
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState<CalendarEvent['type']>('task')
  const [newDate, setNewDate] = useState(toDateKey(today))
  const [saving, setSaving] = useState(false)

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1)
    const lastDay = new Date(viewYear, viewMonth + 1, 0)
    const startOffset = firstDay.getDay() // 0=Sun
    const days: (Date | null)[] = []

    for (let i = 0; i < startOffset; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(viewYear, viewMonth, d))

    // pad to 6 rows
    while (days.length % 7 !== 0) days.push(null)
    return days
  }, [viewYear, viewMonth])

  // Group events by date key
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    events.forEach((e) => {
      const key = parseEventDate(e.date)
      if (!key) return
      if (!map[key]) map[key] = []
      map[key].push(e)
    })
    return map
  }, [events])

  const selectedDayEvents = useMemo(
    () => (selectedDay ? (eventsByDate[selectedDay] ?? []) : []),
    [selectedDay, eventsByDate]
  )

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || saving) return
    setSaving(true)
    await onAddEvent?.(newDate, newTitle.trim(), newType)
    setNewTitle('')
    setAddFormOpen(false)
    setSelectedDay(newDate)
    setSaving(false)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Calendar grid */}
      <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-[#0B2545] px-5 py-3">
          <button onClick={prevMonth} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10" aria-label="Mes anterior">
            <FiChevronLeft size={18} />
          </button>
          <h3 className="font-bold text-white">
            {MONTHS_ES[viewMonth]} {viewYear}
          </h3>
          <button onClick={nextMonth} className="rounded-lg p-1.5 text-white/70 hover:bg-white/10" aria-label="Mes siguiente">
            <FiChevronRight size={18} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="h-20 border-b border-r border-gray-50 bg-gray-50/50" />

            const key = toDateKey(day)
            const dayEvents = eventsByDate[key] ?? []
            const isToday = key === toDateKey(today)
            const isSelected = key === selectedDay
            const isWeekend = day.getDay() === 0 || day.getDay() === 6

            return (
              <div
                key={key}
                onClick={() => setSelectedDay(key)}
                className={`relative h-20 cursor-pointer border-b border-r border-gray-100 p-1.5 transition-colors hover:bg-blue-50/50 ${
                  isSelected ? 'bg-[#00A676]/10 ring-1 ring-inset ring-[#00A676]' : isWeekend ? 'bg-gray-50/40' : 'bg-white'
                }`}
              >
                <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  isToday ? 'bg-[#00A676] text-white' : isSelected ? 'text-[#00A676]' : 'text-gray-700'
                }`}>
                  {day.getDate()}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <span
                      key={ev.id}
                      className={`h-2 w-2 rounded-full ${TYPE_META[ev.type]?.dot ?? 'bg-gray-300'}`}
                      title={ev.title}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] text-gray-400">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 border-t border-gray-100 bg-gray-50 px-4 py-2">
          {Object.entries(TYPE_META).map(([type, meta]) => (
            <span key={type} className="flex items-center gap-1 text-xs text-gray-600">
              <span className={`h-2 w-2 rounded-full ${meta.dot}`} />{meta.label}
            </span>
          ))}
        </div>
      </div>

      {/* Right panel: selected day events + add form */}
      <div className="flex flex-col gap-4">
        {/* Selected day */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h4 className="font-semibold text-[#0B2545] text-sm">
              {selectedDay
                ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('es-DO', { weekday: 'long', month: 'long', day: 'numeric' })
                : 'Selecciona un día'}
            </h4>
            <button
              onClick={() => { setAddFormOpen(v => !v); if (selectedDay) setNewDate(selectedDay) }}
              className="flex items-center gap-1 rounded-lg bg-[#00A676] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#008F64]"
            >
              <FiPlus size={13} /> Agregar
            </button>
          </div>

          {/* Add form */}
          {addFormOpen && (
            <form onSubmit={handleAdd} className="border-b border-gray-100 bg-gray-50 p-4 space-y-3">
              <div>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Título del evento..."
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as any)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                  aria-label="Tipo de evento"
                >
                  {Object.entries(TYPE_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A676]"
                  aria-label="Fecha del evento"
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-[#00A676] py-2 text-xs font-bold text-white hover:bg-[#008F64] disabled:opacity-50">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" aria-label="Cerrar" onClick={() => setAddFormOpen(false)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100">
                  <FiX size={14} aria-hidden="true" />
                </button>
              </div>
            </form>
          )}

          {/* Events list */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">Cargando...</div>
            ) : selectedDayEvents.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Sin eventos este día
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {selectedDayEvents.map((ev) => {
                  const meta = TYPE_META[ev.type] ?? TYPE_META.other
                  const icon = ev.status === 'done'
                    ? <FiCheckCircle className="text-emerald-500" />
                    : ev.status === 'overdue'
                    ? <FiAlertCircle className="text-rose-500" />
                    : <FiClock className="text-gray-400" />
                  return (
                    <div key={ev.id} className={`flex items-start gap-3 border-l-4 px-4 py-3 ${meta.bg} ${meta.border}`}>
                      <div className="mt-0.5 shrink-0">{icon}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 leading-snug">{ev.title}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                          {ev.priority === 'high' && <span className="text-xs text-rose-600 font-medium">Alta prioridad</span>}
                        </div>
                        {ev.note && <p className="mt-1 text-xs text-gray-500 line-clamp-2">{ev.note}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming (next 7 days) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h4 className="font-semibold text-[#0B2545] text-sm">Próximos 7 días</h4>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {(() => {
              const upcoming: CalendarEvent[] = []
              for (let i = 0; i <= 7; i++) {
                const d = new Date(today)
                d.setDate(today.getDate() + i)
                const key = toDateKey(d)
                const evs = eventsByDate[key] ?? []
                evs.forEach(ev => upcoming.push(ev))
              }
              if (upcoming.length === 0) {
                return <p className="px-4 py-6 text-center text-xs text-gray-400">Sin eventos próximos</p>
              }
              return (
                <div className="divide-y divide-gray-50">
                  {upcoming.slice(0, 8).map(ev => {
                    const meta = TYPE_META[ev.type] ?? TYPE_META.other
                    return (
                      <div key={ev.id} className="flex items-center gap-3 px-4 py-2.5">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-800 truncate">{ev.title}</p>
                          <p className="text-xs text-gray-400">{new Date(ev.date + 'T00:00:00').toLocaleDateString('es-DO', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}
