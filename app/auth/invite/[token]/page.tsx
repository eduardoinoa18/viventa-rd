'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { FiCheck, FiLoader } from 'react-icons/fi'

type InviteRole = 'agent' | 'broker' | 'constructora' | 'buyer' | 'user' | 'admin'

interface InviteData {
  email: string
  name: string
  role: InviteRole
  expiresAt: string
  userProfile?: {
    phone?: string
    photoURL?: string
    bio?: string
    brokerageName?: string
    companyInfo?: string
    whatsapp?: string
    licenseNumber?: string
  }
}

export default function InviteOnboardingPage() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [invite, setInvite] = useState<InviteData | null>(null)
  const [error, setError] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [phone, setPhone] = useState('')
  const [photoURL, setPhotoURL] = useState('')
  const [bio, setBio] = useState('')
  const [brokerageName, setBrokerageName] = useState('')
  const [companyInfo, setCompanyInfo] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  useEffect(() => {
    if (!token) return
    verifyInvite()
  }, [token])

  async function verifyInvite() {
    try {
      setLoading(true)
      const res = await fetch('/api/invitations/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setError(data?.error || 'Invitación no válida')
        return
      }

      const invitation = data.invitation as InviteData
      setInvite(invitation)
      setPhone(invitation.userProfile?.phone || '')
      setPhotoURL(invitation.userProfile?.photoURL || '')
      setBio(invitation.userProfile?.bio || '')
      setBrokerageName(invitation.userProfile?.brokerageName || '')
      setCompanyInfo(invitation.userProfile?.companyInfo || '')
      setWhatsapp(invitation.userProfile?.whatsapp || '')
      setLicenseNumber(invitation.userProfile?.licenseNumber || '')
    } catch (err) {
      console.error(err)
      setError('No se pudo verificar la invitación')
    } finally {
      setLoading(false)
    }
  }

  const passwordChecks = useMemo(() => {
    return {
      min: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      num: /\d/.test(password),
      match: password.length > 0 && password === confirmPassword,
    }
  }, [password, confirmPassword])

  const canGoStep2 = Object.values(passwordChecks).every(Boolean)

  const roleMeta = useMemo(() => {
    if (!invite) return { label: 'Usuario', profileHint: 'Completa tu perfil para iniciar rápido.' }
    if (invite.role === 'constructora') {
      return {
        label: 'Constructora',
        profileHint: 'Agrega empresa, WhatsApp y descripción de proyectos para activar tu presencia comercial.',
      }
    }
    if (invite.role === 'broker') {
      return {
        label: 'Broker',
        profileHint: 'Completa datos de tu firma para acelerar tu activación en el panel.',
      }
    }
    if (invite.role === 'agent') {
      return {
        label: 'Agente',
        profileHint: 'Tu perfil completo mejora visibilidad y confianza en listados y leads.',
      }
    }
    if (invite.role === 'buyer') {
      return { label: 'Comprador', profileHint: 'Completa tu perfil para iniciar rápido.' }
    }
    return { label: 'Usuario', profileHint: 'Completa tu perfil para iniciar rápido.' }
  }, [invite])

  async function completeInvitation() {
    if (!invite) return
    if (!canGoStep2) {
      toast.error('Primero debes crear una contraseña segura')
      return
    }
    if (!termsAccepted) {
      toast.error('Debes aceptar los términos y la política de privacidad')
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch('/api/invitations/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
          phone,
          photoURL,
          bio,
          brokerageName,
          companyInfo,
          whatsapp,
          licenseNumber,
          termsAccepted,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No se pudo completar el onboarding')
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invite.email, password }),
      })
      const loginData = await loginRes.json()
      if (!loginRes.ok || !loginData?.ok) {
        throw new Error(loginData?.error || 'Perfil completado, pero falló el inicio de sesión automático')
      }

      toast.success('¡Bienvenido a Viventa!')
      router.replace(loginData.redirect || '/dashboard')
    } catch (err: any) {
      toast.error(err?.message || 'No se pudo completar la invitación')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-10 h-10 animate-spin text-[#00A676] mx-auto mb-3" />
          <p className="text-gray-600">Validando invitación...</p>
        </div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-[#0B2545] mb-3">Invitación no válida</h1>
          <p className="text-gray-600 mb-6">{error || 'La invitación no está disponible'}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-[#00A676] text-white rounded-lg"
          >
            Ir a Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-[#0B2545]">Completa tu perfil en Viventa</h1>
          <p className="text-sm text-gray-600 mt-1">{invite.email} • Rol: {roleMeta.label}</p>
          <p className="text-xs text-gray-500 mt-1">Vence: {new Date(invite.expiresAt).toLocaleString()}</p>
          <p className="text-xs text-[#0B2545] mt-2">{roleMeta.profileHint}</p>
        </div>

        <div className="px-6 pt-5">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
            <span className={`${step >= 1 ? 'bg-[#00A676] text-white' : 'bg-gray-200'} rounded-full w-6 h-6 inline-flex items-center justify-center`}>1</span>
            <span>Contraseña</span>
            <span>•</span>
            <span className={`${step >= 2 ? 'font-semibold text-[#0B2545]' : ''}`}>2 Perfil</span>
            <span>•</span>
            <span className={`${step >= 3 ? 'font-semibold text-[#0B2545]' : ''}`}>3 Acuerdos</span>
          </div>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invite-password">Crear contraseña</label>
              <input id="invite-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" aria-label="Crear contraseña" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="invite-confirmPassword">Confirmar contraseña</label>
              <input id="invite-confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" aria-label="Confirmar contraseña" />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 space-y-1">
              <CheckLine ok={passwordChecks.min} label="Mínimo 8 caracteres" />
              <CheckLine ok={passwordChecks.upper} label="Al menos 1 letra mayúscula" />
              <CheckLine ok={passwordChecks.lower} label="Al menos 1 letra minúscula" />
              <CheckLine ok={passwordChecks.num} label="Al menos 1 número" />
              <CheckLine ok={passwordChecks.match} label="Las contraseñas coinciden" />
            </div>
            <div className="flex justify-end">
              <button
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg bg-[#00A676] text-white disabled:opacity-50"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Teléfono" value={phone} onChange={setPhone} />
              <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
            </div>
            <Field label="URL de foto de perfil" value={photoURL} onChange={setPhotoURL} />
            <Field label="Bio" value={bio} onChange={setBio} />

            {invite.role === 'agent' && (
              <Field label="Nombre de la inmobiliaria" value={brokerageName} onChange={setBrokerageName} />
            )}
            {invite.role === 'broker' && (
              <Field label="Nombre de la inmobiliaria" value={brokerageName} onChange={setBrokerageName} />
            )}
            {invite.role === 'constructora' && (
              <Field label="Información de la empresa" value={companyInfo} onChange={setCompanyInfo} />
            )}

            <Field label="Número de licencia (opcional)" value={licenseNumber} onChange={setLicenseNumber} />

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border border-gray-300">Atrás</button>
              <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg bg-[#00A676] text-white">Continuar</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-6 space-y-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1" />
              <span>
                Acepto los{' '}
                <a href="/terminos" target="_blank" rel="noreferrer" className="text-[#004AAD] hover:underline">Términos y Condiciones</a>
                {' '}y la{' '}
                <a href="/privacidad" target="_blank" rel="noreferrer" className="text-[#004AAD] hover:underline">Política de Privacidad</a>
                {' '}de VIVENTA.
              </span>
            </label>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border border-gray-300">Atrás</button>
              <button
                onClick={completeInvitation}
                disabled={!termsAccepted || submitting}
                className="px-4 py-2 rounded-lg bg-[#00A676] text-white disabled:opacity-50"
              >
                {submitting ? 'Finalizando...' : 'Completar y entrar al panel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CheckLine({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <FiCheck className={ok ? 'text-green-600' : 'text-gray-300'} />
      <span className={ok ? 'text-green-700 font-medium' : 'text-gray-500'}>{label}</span>
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  const fieldId = `invite-field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={fieldId}>{label}</label>
      <input id={fieldId} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" aria-label={label} />
    </div>
  )
}
