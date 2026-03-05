'use client'

import { useEffect, useMemo, useState } from 'react'

type SessionShape = {
  uid: string
  email: string | null
  role: string
  impersonation?: {
    active: boolean
    adminId: string
    adminEmail: string
    startedAt: number
  } | null
}

export default function ImpersonationBanner() {
  const [session, setSession] = useState<SessionShape | null>(null)
  const [loading, setLoading] = useState(true)
  const [stopping, setStopping] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || !json?.ok || !json?.session) {
          setSession(null)
          return
        }

        setSession(json.session as SessionShape)
      } catch {
        setSession(null)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const impersonation = session?.impersonation
  const isActive = Boolean(impersonation?.active)

  const startedAtText = useMemo(() => {
    if (!impersonation?.startedAt) return 'unknown'
    const date = new Date(impersonation.startedAt)
    if (!Number.isFinite(date.getTime())) return 'unknown'
    return date.toLocaleString()
  }, [impersonation?.startedAt])

  const stopImpersonation = async () => {
    setStopping(true)
    try {
      const res = await fetch('/api/admin/stop-impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.ok) {
        const message = json?.error || 'Failed to stop impersonation'
        alert(message)
        return
      }

      window.location.href = String(json?.redirect || '/master')
    } finally {
      setStopping(false)
    }
  }

  if (loading || !isActive || !impersonation) return null

  return (
    <div className="w-full bg-red-700 text-white border-b border-red-800">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 text-sm">
        <div>
          <div className="font-semibold">You are impersonating {session?.email || session?.uid} ({session?.role})</div>
          <div className="text-red-100 text-xs">
            Actions are performed as this user. Logged in as Admin: {impersonation.adminEmail} · Started: {startedAtText}
          </div>
        </div>
        <button
          onClick={stopImpersonation}
          disabled={stopping}
          className="rounded-md border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 disabled:opacity-60"
        >
          {stopping ? 'Stopping...' : 'Stop Impersonation'}
        </button>
      </div>
    </div>
  )
}
