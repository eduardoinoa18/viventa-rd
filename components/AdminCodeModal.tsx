import { useEffect, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions, auth } from '../lib/firebaseClient'

export default function AdminCodeModal({ onVerified }: { onVerified: () => void }) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    // Send code on mount
    async function sendCode() {
      setSending(true)
      try {
        const sendAdminCode = httpsCallable(functions, 'sendAdminCode')
        await sendAdminCode({})
        setStatus('Code sent to your email.')
      } catch (err: any) {
        setStatus(err.message || 'Error sending code')
      }
      setSending(false)
    }
    sendCode()
  }, [])

  async function verify() {
    if (!code) return
    try {
      const verifyAdminCode = httpsCallable(functions, 'verifyAdminCode')
      const res: any = await verifyAdminCode({ code })
      setStatus('Verified!')
      onVerified()
    } catch (err: any) {
      setStatus(err.message || 'Invalid code')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl font-bold mb-2">Admin Verification</h2>
        <p className="mb-3 text-gray-600">Enter the 6-digit code sent to your email.</p>
        <input value={code} onChange={e=>setCode(e.target.value)} maxLength={6} className="w-full px-3 py-2 border rounded mb-3" placeholder="Code" />
        <button onClick={verify} className="w-full px-4 py-2 bg-[#00A6A6] text-white rounded mb-2">Verify</button>
        {sending && <div className="text-sm text-gray-500">Sending code...</div>}
        {status && <div className="text-sm text-gray-700">{status}</div>}
      </div>
    </div>
  )
}
