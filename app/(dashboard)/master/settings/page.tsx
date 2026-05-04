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

  const applyPreset = (preset: 'open' | 'controlled' | 'maintenance') => {
    if (preset === 'open') {
      setForm((prev) => ({
        ...prev,
        maintenanceMode: false,
        allowRegistration: true,
        allowAgentApplications: true,
        allowBrokerApplications: true,
      }))
      return
    }

    if (preset === 'controlled') {
      setForm((prev) => ({
        ...prev,
        maintenanceMode: false,
        allowRegistration: false,
        allowAgentApplications: true,
        allowBrokerApplications: false,
      }))
      return
    }

    setForm((prev) => ({
      ...prev,
      maintenanceMode: true,
      allowRegistration: false,
      allowAgentApplications: false,
      allowBrokerApplications: false,
    }))
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
          <h1 className="text-2xl font-bold text-[#0B2545]">Configuración</h1>
          <p className="text-sm text-gray-600 mt-1">Configuración operativa del portal maestro.</p>
        </div>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-3">
          <h2 className="text-lg font-semibold text-[#0B2545]">Perfiles operativos</h2>
          <p className="text-sm text-gray-600">Aplica una base rápida y luego ajusta detalles antes de guardar.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('open')}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Crecimiento abierto
            </button>
            <button
              type="button"
              onClick={() => applyPreset('controlled')}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Entrada controlada
            </button>
            <button
              type="button"
              onClick={() => applyPreset('maintenance')}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Bloqueo de mantenimiento
            </button>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[#0B2545]">General</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              Nombre del sitio
              <input
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.siteName || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, siteName: e.target.value }))}
              />
            </label>
            <label className="text-sm text-gray-700">
              Correo de soporte
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
              Máx. propiedades por agente
              <input
                type="number"
                min={1}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.maxPropertiesPerAgent || 0}
                onChange={(e) => setForm((prev) => ({ ...prev, maxPropertiesPerAgent: Number(e.target.value) }))}
              />
            </label>
            <label className="text-sm text-gray-700">
              Límite de propiedades destacadas
              <input
                type="number"
                min={1}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg"
                value={form.featuredPropertiesLimit || 0}
                onChange={(e) => setForm((prev) => ({ ...prev, featuredPropertiesLimit: Number(e.target.value) }))}
              />
            </label>
            <label className="text-sm text-gray-700">
              Horas de escalada
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
          <h2 className="text-lg font-semibold text-[#0B2545]">Opciones de activación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Toggle label="Modo mantenimiento" checked={!!form.maintenanceMode} onChange={(v) => setBool('maintenanceMode', v)} />
            <Toggle label="Permitir registros" checked={!!form.allowRegistration} onChange={(v) => setBool('allowRegistration', v)} />
            <Toggle label="Permitir solicitudes de agentes" checked={!!form.allowAgentApplications} onChange={(v) => setBool('allowAgentApplications', v)} />
            <Toggle label="Permitir solicitudes de brokers" checked={!!form.allowBrokerApplications} onChange={(v) => setBool('allowBrokerApplications', v)} />
            <Toggle label="Reasignación manual" checked={!!form.reassignmentPolicy?.manualReassignEnabled} onChange={(v) => setPolicy('manualReassignEnabled', v)} />
            <Toggle label="Sugerir nuevo asignado" checked={!!form.reassignmentPolicy?.suggestNewAssigneeEnabled} onChange={(v) => setPolicy('suggestNewAssigneeEnabled', v)} />
            <Toggle label="Respaldo de broker" checked={!!form.reassignmentPolicy?.brokerFallbackEnabled} onChange={(v) => setPolicy('brokerFallbackEnabled', v)} />
            <Toggle label="Registro de escaladas" checked={!!form.reassignmentPolicy?.escalationLogEnabled} onChange={(v) => setPolicy('escalationLogEnabled', v)} />
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
