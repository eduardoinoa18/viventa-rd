// app/auth/ProtectedClient.tsx
'use client'
import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedClient({ children, allowed = ['master_admin'] }: { children: ReactNode, allowed?: string[] }) {
  const router = useRouter()
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    // E2E test bypass: allow access when explicitly requested with e2e flag
    try {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_E2E === '1') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('e2e') === '1') {
          setOk(true)
          return
        }
      }
    } catch {}

    let cancelled = false

    const check = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' })
        const json = await res.json().catch(() => ({}))
        if (cancelled) return

        const session = json?.session
        if (!res.ok || !session) {
          setTimeout(() => router.push('/login'), 200)
          setOk(false)
          return
        }

        if (session.role === 'master_admin' && session.twoFactorVerified === false) {
          setTimeout(() => router.push('/verify-2fa'), 200)
          setOk(false)
          return
        }

        if (!allowed.includes(session.role)) {
          setTimeout(() => router.push('/'), 200)
          setOk(false)
          return
        }

        setOk(true)
      } catch {
        if (cancelled) return
        setTimeout(() => router.push('/login'), 200)
        setOk(false)
      }
    }

    check()
    return () => {
      cancelled = true
    }
  }, [allowed, router])

  if (ok === null) return <div className="p-6">Checking access...</div>
  if (ok === false) return <div className="p-6 text-red-600">Redirecting...</div>
  return <>{children}</>
}
