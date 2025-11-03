'use client'
import { useState } from 'react'
import { db } from '../lib/firebaseClient'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

type Locale = 'en' | 'es'

interface ProfessionalContactFormProps {
  locale: Locale
  source?: string
  className?: string
}

export default function ProfessionalContactForm({ locale, source = 'professionals', className = '' }: ProfessionalContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('Agent')
  const [interests, setInterests] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const t = (key: string): string => {
    const dict: Record<Locale, Record<string, string>> = {
      en: {
        heading: 'Ready to get started?',
        subheading: 'Tell us a bit about you and we will reach out shortly.',
        name: 'Full name',
        email: 'Email',
        phone: 'Phone (optional)',
        company: 'Company (optional)',
        role: 'Role',
        role_agent: 'Agent',
        role_broker: 'Broker',
        role_developer: 'Developer',
        role_other: 'Other',
        interests: 'I am interested in',
        int_mls: 'MLS access',
        int_promote: 'Promote projects',
        int_team: 'Team/CRM & onboarding',
        int_api: 'API & integrations',
        int_other: 'Other',
        message: 'Message (optional)',
        consent: 'I agree to be contacted and accept the privacy terms',
        submit: 'Send',
        sending: 'Sending…',
        success: 'Thanks! We will contact you shortly.',
        error: 'Something went wrong. Please try again.',
        required: 'This field is required',
        privacy: 'privacy policy',
      },
      es: {
        heading: '¿Listo para comenzar?',
        subheading: 'Cuéntanos sobre ti y te contactaremos muy pronto.',
        name: 'Nombre completo',
        email: 'Correo electrónico',
        phone: 'Teléfono (opcional)',
        company: 'Empresa (opcional)',
        role: 'Rol',
        role_agent: 'Agente',
        role_broker: 'Bróker',
        role_developer: 'Constructora',
        role_other: 'Otro',
        interests: 'Estoy interesado en',
        int_mls: 'Acceso al MLS',
        int_promote: 'Promocionar proyectos',
        int_team: 'Equipo/CRM y onboarding',
        int_api: 'API e integraciones',
        int_other: 'Otro',
        message: 'Mensaje (opcional)',
        consent: 'Acepto ser contactado y los términos de privacidad',
        submit: 'Enviar',
        sending: 'Enviando…',
        success: '¡Gracias! Te contactaremos pronto.',
        error: 'Ocurrió un error. Intenta de nuevo.',
        required: 'Este campo es obligatorio',
        privacy: 'política de privacidad',
      }
    }
    return dict[locale][key]
  }

  function toggleInterest(value: string) {
    setInterests(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value])
  }

  function validate() {
    setError(null); setSuccess(null)
    if (!name.trim()) { setError(t('required')); return false }
    if (!email.trim()) { setError(t('required')); return false }
    // basic email check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Invalid email'); return false }
    if (!consent) { setError(t('required')); return false }
    return true
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await addDoc(collection(db, 'marketing_leads'), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || null,
        company: company.trim() || null,
        role,
        interests,
        message: message.trim() || null,
        consent,
        createdAt: serverTimestamp(),
        source,
      })
      setSuccess(t('success'))
      setName(''); setEmail(''); setPhone(''); setCompany(''); setRole(locale === 'es' ? 'Agente' : 'Agent'); setInterests([]); setMessage(''); setConsent(false)
    } catch (err) {
      console.error(err)
      setError(t('error'))
    } finally {
      setLoading(false)
    }
  }

  const roles = locale === 'es'
    ? ['Agente', 'Bróker', 'Constructora', 'Otro']
    : ['Agent', 'Broker', 'Developer', 'Other']

  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{t('heading')}</h2>
        <p className="text-gray-600 mb-4">{t('subheading')}</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-2 text-sm">{success}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('name')}</label>
          <input value={name} onChange={e=>setName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('email')}</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('phone')}</label>
          <input inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('company')}</label>
          <input value={company} onChange={e=>setCompany(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('role')}</label>
          <select value={role} onChange={e=>setRole(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('interests')}</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={interests.includes('mls')} onChange={()=>toggleInterest('mls')} /> {t('int_mls')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={interests.includes('promote')} onChange={()=>toggleInterest('promote')} /> {t('int_promote')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={interests.includes('team')} onChange={()=>toggleInterest('team')} /> {t('int_team')}
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={interests.includes('api')} onChange={()=>toggleInterest('api')} /> {t('int_api')}
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">{t('message')}</label>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      <label className="flex items-start gap-3 text-sm text-gray-700">
        <input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} className="mt-1" />
        <span>
          {t('consent')}{' '}(
          <a href="/disclosures" className="underline text-blue-600 hover:text-blue-800" target="_blank" rel="noreferrer">{t('privacy')}</a>
          )
        </span>
      </label>

      <button type="submit" disabled={loading} className={`w-full px-6 py-3 rounded-lg font-semibold inline-flex items-center justify-center gap-2 transition-colors ${loading ? 'bg-gray-300 text-gray-600' : 'bg-[#00A6A6] text-white hover:bg-[#008f8f]'}`}>
        {loading ? t('sending') : t('submit')}
      </button>
    </form>
  )
}
