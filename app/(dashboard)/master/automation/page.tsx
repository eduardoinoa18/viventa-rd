'use client'

import { useEffect, useState } from 'react'
import PageHeader from '@/components/ui/PageHeader'

type AutomationRun = {
  id: string
  createdAt: string | null
  actorId: string
  checked: { broker: number; constructora: number }
  alerts: {
    broker: number
    brokerOverdue: number
    brokerAttention: number
    brokerTasksCreated: number
    constructora: number
    constructoraOverdue: number
    constructoraAttention: number
    constructoraTasksCreated: number
  }
  limits: {
    broker: number
    constructora: number
    brokerTasks: number
    constructoraTasks: number
  }
}

function fmtDateTime(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (!Number.isFinite(d.getTime())) return '—'
  return d.toLocaleString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function AutomationHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [runs, setRuns] = useState<AutomationRun[]>([])

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError('')
        const res = await fetch('/api/admin/deals/automation/history?limit=50', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok) throw new Error(json?.error || 'Error cargando historial')
        setRuns(Array.isArray(json?.runs) ? json.runs : [])
      } catch (loadError: any) {
        setError(loadError?.message || 'Error cargando historial de automatización')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totals = runs.reduce(
    (acc, r) => ({
      brokerChecked: acc.brokerChecked + r.checked.broker,
      constructoraChecked: acc.constructoraChecked + r.checked.constructora,
      brokerAlerted: acc.brokerAlerted + r.alerts.broker,
      constructoraAlerted: acc.constructoraAlerted + r.alerts.constructora,
      brokerTasks: acc.brokerTasks + r.alerts.brokerTasksCreated,
      constructoraTasks: acc.constructoraTasks + r.alerts.constructoraTasksCreated,
    }),
    { brokerChecked: 0, constructoraChecked: 0, brokerAlerted: 0, constructoraAlerted: 0, brokerTasks: 0, constructoraTasks: 0 },
  )

  return (
    <div>
      <PageHeader
        eyebrow="Admin — System"
        title="Deal Automation"
        description="Historial de ejecuciones del cron de SLA y escalación de deals. Cada fila es una corrida del endpoint /api/admin/deals/automation."
        actions={[
          { label: 'Trigger Run', href: '/api/admin/deals/automation', variant: 'secondary' },
        ]}
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : (
        <>
          {/* Aggregate stats */}
          {runs.length > 0 ? (
            <section className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
              <StatCard label="Runs" value={runs.length} />
              <StatCard label="Broker Checked" value={totals.brokerChecked} />
              <StatCard label="Broker Alerted" value={totals.brokerAlerted} />
              <StatCard label="Broker Tasks" value={totals.brokerTasks} />
              <StatCard label="Const. Checked" value={totals.constructoraChecked} />
              <StatCard label="Const. Tasks" value={totals.constructoraTasks} />
            </section>
          ) : null}

          {/* Run history table */}
          <section className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Fecha</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Broker verificado</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600">B. Vencido</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600">B. Atención</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600">B. Tareas</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Const. Verificado</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600">C. Vencido</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600">C. Atención</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-gray-600">C. Tareas</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-gray-600">ID de ejecución</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {runs.map((run) => (
                    <tr key={run.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-[#0B2545]">{fmtDateTime(run.createdAt)}</td>
                      <td className="px-3 py-2.5 text-right">{run.checked.broker}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={run.alerts.brokerOverdue > 0 ? 'font-semibold text-rose-600' : ''}>
                          {run.alerts.brokerOverdue}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={run.alerts.brokerAttention > 0 ? 'font-semibold text-amber-600' : ''}>
                          {run.alerts.brokerAttention}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={run.alerts.brokerTasksCreated > 0 ? 'font-semibold text-emerald-600' : ''}>
                          {run.alerts.brokerTasksCreated}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">{run.checked.constructora}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={run.alerts.constructoraOverdue > 0 ? 'font-semibold text-rose-600' : ''}>
                          {run.alerts.constructoraOverdue}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={run.alerts.constructoraAttention > 0 ? 'font-semibold text-amber-600' : ''}>
                          {run.alerts.constructoraAttention}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={run.alerts.constructoraTasksCreated > 0 ? 'font-semibold text-emerald-600' : ''}>
                          {run.alerts.constructoraTasksCreated}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-gray-400">{run.id.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {runs.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center">
                <p className="text-sm text-gray-500">No hay corridas de automatización registradas todavía.</p>
                <p className="mt-1 text-xs text-gray-400">
                  El cron dispara <code className="rounded bg-gray-100 px-1">/api/admin/deals/automation</code> cada 30 minutos.
                </p>
              </div>
            ) : null}
          </section>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-[#0B2545]">{value}</div>
    </div>
  )
}
