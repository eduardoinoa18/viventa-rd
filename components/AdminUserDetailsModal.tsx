"use client";
import { useState } from 'react'
import { FiX, FiSave, FiMail, FiShield, FiCheckCircle } from 'react-icons/fi'
import toast from 'react-hot-toast'

export type AdminUser = {
  id: string
  uid?: string
  name: string
  email: string
  phone?: string
  role: string
  status: string
  company?: string
  brokerage?: string
  emailVerified?: boolean
  verified?: boolean
  professionalCode?: string
  agentCode?: string
  brokerCode?: string
  lastLoginAt?: any
  createdAt?: any
  approvedAt?: any
}

export default function AdminUserDetailsModal({
  user,
  onClose,
  onSaved,
}: {
  user: AdminUser
  onClose: () => void
  onSaved?: (updated: Partial<AdminUser>) => void
}) {
  const [name, setName] = useState(user.name || '')
  const [phone, setPhone] = useState(user.phone || '')
  const [company, setCompany] = useState(user.company || '')
  const [brokerage, setBrokerage] = useState(user.brokerage || '')
  const [status, setStatus] = useState(user.status || 'active')
  const [emailVerified, setEmailVerified] = useState(!!user.emailVerified)
  const [verified, setVerified] = useState(!!user.verified)
  const [saving, setSaving] = useState(false)
  const code = user.professionalCode || user.agentCode || user.brokerCode

  async function save() {
    try {
      setSaving(true)
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          name,
          phone,
          company,
          brokerage,
          status,
          emailVerified,
          verified,
        })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Failed to save user')
      toast.success('Saved')
      onSaved?.({ name, phone, company, brokerage, status, emailVerified, verified })
      onClose()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  async function resetPassword() {
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid || user.id, email: user.email })
      })
      const json = await res.json()
      if (!json.ok) throw new Error(json.error || 'Failed to generate reset link')
      await navigator.clipboard.writeText(json.resetLink)
      toast.success('Reset link copied to clipboard')
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate reset link')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">User Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close details"><FiX size={24} /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm text-gray-600">Name</label>
            <input id="name" placeholder="Full name" className="mt-1 w-full px-3 py-2 border rounded" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm text-gray-600">Email</label>
            <input id="email" placeholder="email@example.com" className="mt-1 w-full px-3 py-2 border rounded bg-gray-50" value={user.email} readOnly />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm text-gray-600">Phone</label>
            <input id="phone" placeholder="Phone number" className="mt-1 w-full px-3 py-2 border rounded" value={phone} onChange={e=>setPhone(e.target.value)} />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm text-gray-600">Status</label>
            <select id="status" className="mt-1 w-full px-3 py-2 border rounded" value={status} onChange={e=>setStatus(e.target.value)}>
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="suspended">suspended</option>
            </select>
          </div>
          <div>
            <label htmlFor="company" className="block text-sm text-gray-600">Company</label>
            <input id="company" placeholder="Company" className="mt-1 w-full px-3 py-2 border rounded" value={company} onChange={e=>setCompany(e.target.value)} />
          </div>
          <div>
            <label htmlFor="brokerage" className="block text-sm text-gray-600">Brokerage</label>
            <input id="brokerage" placeholder="Brokerage" className="mt-1 w-full px-3 py-2 border rounded" value={brokerage} onChange={e=>setBrokerage(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input id="emailVerified" type="checkbox" className="h-4 w-4" checked={emailVerified} onChange={e=>setEmailVerified(e.target.checked)} />
            <label htmlFor="emailVerified" className="text-sm text-gray-700">Email Verified</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="verified" type="checkbox" className="h-4 w-4" checked={verified} onChange={e=>setVerified(e.target.checked)} />
            <label htmlFor="verified" className="text-sm text-gray-700">Verified (internal)</label>
          </div>
          {code && (
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600">Professional Code</label>
              <div className="mt-1 font-mono font-bold text-lg text-[#00A676]">{code}</div>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-between items-center">
          <button onClick={resetPassword} className="inline-flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"><FiMail /> Reset password</button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-[#0B2545] text-white rounded hover:bg-[#0B2545]/90 disabled:opacity-60">
              <FiSave /> {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
