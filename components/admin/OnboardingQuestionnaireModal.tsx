'use client'

import { useEffect, useState } from 'react'
import { FiX, FiClipboard } from 'react-icons/fi'
import toast from 'react-hot-toast'

type Questionnaire = {
  onboardingStage: 'discovery' | 'qualification' | 'ready_for_invite' | 'invited' | 'activated'
  businessGoal: string
  targetZones: string
  budgetRange: string
  preferredInventory: string
  urgency: 'low' | 'medium' | 'high'
  communicationPreference: 'whatsapp' | 'email' | 'phone'
  notes: string
}

type UserShape = {
  id: string
  name: string
  email: string
  onboardingQuestionnaire?: Partial<Questionnaire>
}

interface Props {
  isOpen: boolean
  user: UserShape | null
  onClose: () => void
  onSaved: () => void
}

const DEFAULT_FORM: Questionnaire = {
  onboardingStage: 'discovery',
  businessGoal: '',
  targetZones: '',
  budgetRange: '',
  preferredInventory: '',
  urgency: 'medium',
  communicationPreference: 'whatsapp',
  notes: '',
}

export default function OnboardingQuestionnaireModal({ isOpen, user, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<Questionnaire>(DEFAULT_FORM)

  useEffect(() => {
    if (!isOpen || !user) return
    const source = user.onboardingQuestionnaire || {}
    setForm({
      onboardingStage: (source.onboardingStage as Questionnaire['onboardingStage']) || 'discovery',
      businessGoal: source.businessGoal || '',
      targetZones: source.targetZones || '',
      budgetRange: source.budgetRange || '',
      preferredInventory: source.preferredInventory || '',
      urgency: (source.urgency as Questionnaire['urgency']) || 'medium',
      communicationPreference: (source.communicationPreference as Questionnaire['communicationPreference']) || 'whatsapp',
      notes: source.notes || '',
    })
  }, [isOpen, user])

  const setField = <K extends keyof Questionnaire>(key: K, value: Questionnaire[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    if (!user) return
    if (!form.businessGoal.trim()) {
      toast.error('El objetivo de negocio es requerido')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          onboardingQuestionnaire: form,
          onboardingStatus: form.onboardingStage,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        toast.error(json.error || 'No se pudo guardar el cuestionario de onboarding')
        return
      }

      toast.success('Cuestionario de onboarding guardado')
      onSaved()
      onClose()
    } catch (error) {
      console.error('save onboarding questionnaire error', error)
      toast.error('No se pudo guardar el cuestionario de onboarding')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiClipboard className="w-5 h-5" />
            Cuestionario de Onboarding
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {user.name} ({user.email})
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldSelect
            label="Etapa de onboarding"
            value={form.onboardingStage}
            onChange={(value) => setField('onboardingStage', value as Questionnaire['onboardingStage'])}
            options={[
              { value: 'discovery', label: 'Descubrimiento' },
              { value: 'qualification', label: 'Calificación' },
              { value: 'ready_for_invite', label: 'Listo para invitar' },
              { value: 'invited', label: 'Invitado' },
              { value: 'activated', label: 'Activado' },
            ]}
          />

          <FieldSelect
            label="Urgencia"
            value={form.urgency}
            onChange={(value) => setField('urgency', value as Questionnaire['urgency'])}
            options={[
              { value: 'low', label: 'Baja' },
              { value: 'medium', label: 'Media' },
              { value: 'high', label: 'Alta' },
            ]}
          />
        </div>

        <FieldInput label="Objetivo de negocio" value={form.businessGoal} onChange={(value) => setField('businessGoal', value)} required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldInput label="Zonas objetivo" value={form.targetZones} onChange={(value) => setField('targetZones', value)} placeholder="Santo Domingo, Punta Cana" />
          <FieldInput label="Rango de presupuesto" value={form.budgetRange} onChange={(value) => setField('budgetRange', value)} placeholder="USD 150k - 400k" />
        </div>

        <FieldInput label="Inventario preferido" value={form.preferredInventory} onChange={(value) => setField('preferredInventory', value)} placeholder="Condominios de lujo, preventa, lotes" />

        <FieldSelect
          label="Canal de comunicación preferido"
          value={form.communicationPreference}
          onChange={(value) => setField('communicationPreference', value as Questionnaire['communicationPreference'])}
          options={[
            { value: 'whatsapp', label: 'WhatsApp' },
            { value: 'email', label: 'Email' },
            { value: 'phone', label: 'Teléfono' },
          ]}
        />

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas del administrador</label>
          <textarea
            value={form.notes}
            onChange={(e) => setField('notes', e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="Captura resultados de calificación, bloqueos y próximos pasos..."
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[#0B2545] text-white hover:bg-[#133a66] disabled:opacity-60"
          >
            {loading ? 'Guardando...' : 'Guardar cuestionario'}
          </button>
        </div>
      </div>
    </div>
  )
}

function FieldInput({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  )
}

function FieldSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }> }) {
  const id = `field-${label.replace(/\s+/g, '-').toLowerCase()}`
  return (
    <div className="mt-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  )
}
