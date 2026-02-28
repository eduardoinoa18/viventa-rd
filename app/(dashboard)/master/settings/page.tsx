'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type AdminSettings = {
  siteName?: string
  supportEmail?: string
  maintenanceMode?: boolean
  allowRegistration?: boolean
  allowAgentApplications?: boolean
  allowBrokerApplications?: boolean
  maxPropertiesPerAgent?: number
  featuredPropertiesLimit?: number
  controlEscalationHours?: number
  reassignmentPolicy?: {
    manualReassignEnabled?: boolean
    suggestNewAssigneeEnabled?: boolean
    brokerFallbackEnabled?: boolean
    escalationLogEnabled?: boolean
  }
}

const DEFAULTS: AdminSettings = {
  siteName: 'VIVENTA',
  supportEmail: 'support@viventa.com',
  maintenanceMode: false,
  allowRegistration: true,
  allowAgentApplications: true,
  allowBrokerApplications: true,
  maxPropertiesPerAgent: 100,
  featuredPropertiesLimit: 10,
  controlEscalationHours: 2,
  reassignmentPolicy: {
    manualReassignEnabled: true,
    suggestNewAssigneeEnabled: true,
    brokerFallbackEnabled: true,
    escalationLogEnabled: true,
  },
}

export default function MasterSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AdminSettings>(DEFAULTS)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/settings', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || 'No se pudieron cargar los ajustes')
        }

        setForm({
          ...DEFAULTS,
          ...(json.data || {}),
          reassignmentPolicy: {
            ...DEFAULTS.reassignmentPolicy,
            ...(json.data?.reassignmentPolicy || {}),
          },
        })
      } catch (error: any) {
        toast.error(error?.message || 'Error cargando ajustes')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const setBool = (field: keyof AdminSettings, value: boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const setPolicy = (field: keyof NonNullable<AdminSettings['reassignmentPolicy']>, value: boolean) => {
    setForm((prev) => ({
      ...prev,
      reassignmentPolicy: {
        ...(prev.reassignmentPolicy || {}),
        [field]: value,
      },
    }))
  }

  const save = async () => {
    try {
      setSaving(true)
      const payload: AdminSettings = {
        ...form,
        maxPropertiesPerAgent: Number(form.maxPropertiesPerAgent || 0),
        featuredPropertiesLimit: Number(form.featuredPropertiesLimit || 0),
        controlEscalationHours: Math.max(1, Number(form.controlEscalationHours || 2)),
      }

      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudieron guardar los ajustes')
      }

      toast.success('Ajustes guardados')
    } catch (error: any) {
      toast.error(error?.message || 'Error guardando ajustes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto text-gray-600">Cargando ajustes...</div>
      </main>
    )
  }

  return (
    <main className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <h1 className="text-2xl font-bold text-[#0B2545]">Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Configuración operativa del portal maestro.</p>
        </div>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#0B2545]">General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              Site name
              <input
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.siteName || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, siteName: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-700">
              Support email
              <input
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.supportEmail || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, supportEmail: e.target.value }))}
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#0B2545]">Límites y control</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="text-sm text-gray-700">
              Max properties per agent
              <input
                type="number"
                min={1}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.maxPropertiesPerAgent || 0}
                onChange={(e) => setForm((prev) => ({ ...prev, maxPropertiesPerAgent: Number(e.target.value) }))}
              />
            </label>
            <label className="text-sm text-gray-700">
              Featured properties limit
              <input
                type="number"
                min={1}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.featuredPropertiesLimit || 0}
                onChange={(e) => setForm((prev) => ({ ...prev, featuredPropertiesLimit: Number(e.target.value) }))}
              />
            </label>
            <label className="text-sm text-gray-700">
              Escalation hours
              <input
                type="number"
                min={1}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.controlEscalationHours || 2}
                onChange={(e) => setForm((prev) => ({ ...prev, controlEscalationHours: Number(e.target.value) }))}
              />
            </label>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-3">
          <h2 className="text-lg font-semibold text-[#0B2545]">Flags</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Toggle label="Maintenance mode" checked={!!form.maintenanceMode} onChange={(v) => setBool('maintenanceMode', v)} />
            <Toggle label="Allow registration" checked={!!form.allowRegistration} onChange={(v) => setBool('allowRegistration', v)} />
            <Toggle label="Allow agent applications" checked={!!form.allowAgentApplications} onChange={(v) => setBool('allowAgentApplications', v)} />
            <Toggle label="Allow broker applications" checked={!!form.allowBrokerApplications} onChange={(v) => setBool('allowBrokerApplications', v)} />
            <Toggle label="Manual reassignment" checked={!!form.reassignmentPolicy?.manualReassignEnabled} onChange={(v) => setPolicy('manualReassignEnabled', v)} />
            <Toggle label="Suggest new assignee" checked={!!form.reassignmentPolicy?.suggestNewAssigneeEnabled} onChange={(v) => setPolicy('suggestNewAssigneeEnabled', v)} />
            <Toggle label="Broker fallback" checked={!!form.reassignmentPolicy?.brokerFallbackEnabled} onChange={(v) => setPolicy('brokerFallbackEnabled', v)} />
            <Toggle label="Escalation log" checked={!!form.reassignmentPolicy?.escalationLogEnabled} onChange={(v) => setPolicy('escalationLogEnabled', v)} />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#0B2545] text-white font-semibold hover:bg-[#133a6b] disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </main>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    </label>
  )
}
