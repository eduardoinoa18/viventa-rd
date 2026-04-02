'use client'

import { useEffect, useMemo, useState } from 'react'

type TaskItem = {
  id: string
  title: string
  dueAt?: string | null
  status: string
  priority: string
  source?: string
  linkedTransactionId?: string
  officeId?: string
}

const TASK_STATUSES = ['all', 'pending', 'in_progress', 'done']

function fmtDate(value?: string | null) {
  if (!value) return 'Sin fecha'
  const parsed = new Date(value)
  if (!Number.isFinite(parsed.getTime())) return 'Sin fecha'
  return parsed.toLocaleString('es-DO', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === 'high'
      ? 'bg-rose-50 text-rose-700'
      : priority === 'low'
        ? 'bg-slate-100 text-slate-700'
        : 'bg-amber-50 text-amber-700'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{priority}</span>
}

export default function AgentTasksPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueAt, setTaskDueAt] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [creating, setCreating] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function load() {
    try {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({ limit: '100' })
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/agent/tasks?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudieron cargar las tareas')
      let items: TaskItem[] = Array.isArray(json?.tasks) ? json.tasks : []
      if (query.trim()) {
        const q = query.trim().toLowerCase()
        items = items.filter((t) => t.title.toLowerCase().includes(q))
      }
      setTasks(items)
    } catch (loadError: any) {
      setError(loadError?.message || 'No se pudieron cargar las tareas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, query])

  const summary = useMemo(() => {
    const pending = tasks.filter((t) => t.status === 'pending').length
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length
    const overdue = tasks.filter(
      (t) => t.status !== 'done' && t.dueAt && new Date(t.dueAt) < new Date(),
    ).length
    return { total: tasks.length, pending, inProgress, overdue }
  }, [tasks])

  async function createTask(event: React.FormEvent) {
    event.preventDefault()
    if (!taskTitle.trim()) {
      setError('El título es obligatorio')
      return
    }
    try {
      setCreating(true)
      setError('')
      const res = await fetch('/api/agent/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: taskTitle, dueAt: taskDueAt || null, priority: taskPriority }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo crear la tarea')
      setTaskTitle('')
      setTaskDueAt('')
      setTaskPriority('normal')
      await load()
    } catch (createError: any) {
      setError(createError?.message || 'No se pudo crear la tarea')
    } finally {
      setCreating(false)
    }
  }

  async function updateTaskStatus(id: string, status: 'pending' | 'in_progress' | 'done') {
    try {
      setUpdatingId(id)
      setError('')
      const res = await fetch('/api/agent/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'No se pudo actualizar la tarea')
      await load()
    } catch (updateError: any) {
      setError(updateError?.message || 'No se pudo actualizar la tarea')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-[#0B2545]">My Tasks</h2>
      <p className="mt-1 text-sm text-gray-600">
        Tareas asignadas a ti — incluyendo tareas manuales y escalaciones automáticas de SLA por deals vencidos.
      </p>

      {/* Summary */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
        <Metric label="Total" value={summary.total} />
        <Metric label="Pending" value={summary.pending} />
        <Metric label="In Progress" value={summary.inProgress} />
        <Metric label="Overdue" value={summary.overdue} />
      </div>

      {/* Create form */}
      <form
        onSubmit={createTask}
        className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-gray-200 p-3 md:grid-cols-[minmax(0,1fr)_180px_160px_140px]"
      >
        <input
          value={taskTitle}
          onChange={(e) => setTaskTitle(e.target.value)}
          placeholder="Nueva tarea personal"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={taskDueAt}
          onChange={(e) => setTaskDueAt(e.target.value)}
          type="datetime-local"
          title="Fecha límite de la tarea"
          aria-label="Fecha límite de la tarea"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          value={taskPriority}
          onChange={(e) => setTaskPriority(e.target.value as 'low' | 'normal' | 'high')}
          title="Prioridad de la tarea"
          aria-label="Prioridad de la tarea"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="low">low</option>
          <option value="normal">normal</option>
          <option value="high">high</option>
        </select>
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-[#0B2545] px-3 py-2 text-sm font-medium text-white hover:bg-[#12355f] disabled:opacity-50"
        >
          {creating ? 'Creando...' : 'Crear tarea'}
        </button>
      </form>

      {/* Filter bar */}
      <div className="mt-4 flex flex-col gap-2 rounded-lg border border-gray-200 p-3 md:flex-row md:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por título"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          title="Filtrar tareas por estado"
          aria-label="Filtrar tareas por estado"
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {loading ? <p className="mt-4 text-sm text-gray-500">Cargando tareas...</p> : null}
      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {!loading && !error && (
        <div className="mt-4 space-y-3">
          {tasks.map((task) => {
            const overdue =
              task.status !== 'done' && task.dueAt && new Date(task.dueAt) < new Date()
            return (
              <article key={task.id} className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#0B2545]">{task.title}</h3>
                      <PriorityBadge priority={task.priority || 'normal'} />
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          task.status === 'done'
                            ? 'bg-emerald-50 text-emerald-700'
                            : task.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-700'
                              : overdue
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {task.status}
                      </span>
                      {task.source === 'deal_automation' ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                          automation
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-600">
                      <span>Vence: {fmtDate(task.dueAt)}</span>
                      {task.linkedTransactionId ? (
                        <span className="font-medium text-[#0B2545]">
                          Deal {task.linkedTransactionId.slice(0, 8)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(task.id, 'pending')}
                      disabled={updatingId === task.id}
                      className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50"
                    >
                      Pendiente
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(task.id, 'in_progress')}
                      disabled={updatingId === task.id}
                      className="rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-white disabled:opacity-50"
                    >
                      En progreso
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTaskStatus(task.id, 'done')}
                      disabled={updatingId === task.id}
                      className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Completar
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500">No hay tareas para los filtros seleccionados.</p>
          ) : null}
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-bold text-[#0B2545]">{value}</div>
    </div>
  )
}
