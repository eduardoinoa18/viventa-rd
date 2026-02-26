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
        setError(data?.error || 'Invalid invitation')
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
      setError('Failed to verify invitation')
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

  async function completeInvitation() {
    if (!invite) return
    if (!canGoStep2) {
      toast.error('Please set a strong password first')
      return
    }
    if (!termsAccepted) {
      toast.error('You must accept platform terms')
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
        throw new Error(data?.error || 'Failed to complete onboarding')
      }

      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invite.email, password }),
      })
      const loginData = await loginRes.json()
      if (!loginRes.ok || !loginData?.ok) {
        throw new Error(loginData?.error || 'Profile completed but auto-login failed')
      }

      toast.success('Welcome to Viventa!')
      router.replace(loginData.redirect || '/dashboard')
    } catch (err: any) {
      toast.error(err?.message || 'Failed to complete invitation')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-10 h-10 animate-spin text-[#00A676] mx-auto mb-3" />
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (error || !invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
          <h1 className="text-2xl font-bold text-[#0B2545] mb-3">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{error || 'Invitation not available'}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-[#00A676] text-white rounded-lg"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-[#0B2545]">Complete your Viventa profile</h1>
          <p className="text-sm text-gray-600 mt-1">{invite.email} • Role: {invite.role}</p>
          <p className="text-xs text-gray-500 mt-1">Expires: {new Date(invite.expiresAt).toLocaleString()}</p>
        </div>

        <div className="px-6 pt-5">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
            <span className={`${step >= 1 ? 'bg-[#00A676] text-white' : 'bg-gray-200'} rounded-full w-6 h-6 inline-flex items-center justify-center`}>1</span>
            <span>Password</span>
            <span>•</span>
            <span className={`${step >= 2 ? 'font-semibold text-[#0B2545]' : ''}`}>2 Profile</span>
            <span>•</span>
            <span className={`${step >= 3 ? 'font-semibold text-[#0B2545]' : ''}`}>3 Terms</span>
          </div>
        </div>

        {step === 1 && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Set password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-700 space-y-1">
              <CheckLine ok={passwordChecks.min} label="At least 8 characters" />
              <CheckLine ok={passwordChecks.upper} label="At least 1 uppercase letter" />
              <CheckLine ok={passwordChecks.lower} label="At least 1 lowercase letter" />
              <CheckLine ok={passwordChecks.num} label="At least 1 number" />
              <CheckLine ok={passwordChecks.match} label="Passwords match" />
            </div>
            <div className="flex justify-end">
              <button
                disabled={!canGoStep2}
                onClick={() => setStep(2)}
                className="px-4 py-2 rounded-lg bg-[#00A676] text-white disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone" value={phone} onChange={setPhone} />
              <Field label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
            </div>
            <Field label="Profile Photo URL" value={photoURL} onChange={setPhotoURL} />
            <Field label="Bio" value={bio} onChange={setBio} />

            {invite.role === 'agent' && (
              <Field label="Brokerage Name" value={brokerageName} onChange={setBrokerageName} />
            )}
            {invite.role === 'constructora' && (
              <Field label="Company Info" value={companyInfo} onChange={setCompanyInfo} />
            )}

            <Field label="License Number (Optional)" value={licenseNumber} onChange={setLicenseNumber} />

            <div className="flex justify-between">
              <button onClick={() => setStep(1)} className="px-4 py-2 rounded-lg border border-gray-300">Back</button>
              <button onClick={() => setStep(3)} className="px-4 py-2 rounded-lg bg-[#00A676] text-white">Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-6 space-y-4">
            <label className="flex items-start gap-3 text-sm text-gray-700">
              <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1" />
              <span>I accept Viventa platform terms and privacy policy.</span>
            </label>
            <div className="flex justify-between">
              <button onClick={() => setStep(2)} className="px-4 py-2 rounded-lg border border-gray-300">Back</button>
              <button
                onClick={completeInvitation}
                disabled={!termsAccepted || submitting}
                className="px-4 py-2 rounded-lg bg-[#00A676] text-white disabled:opacity-50"
              >
                {submitting ? 'Finishing...' : 'Complete & Enter Dashboard'}
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
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
    </div>
  )
}
