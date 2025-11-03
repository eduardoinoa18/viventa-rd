// app/auth/ProtectedClient.tsx
'use client'
import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession } from '../../lib/authSession'

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

    const session = getSession()
    if (!session) {
      // not logged in — redirect to login
      setTimeout(() => router.push('/login'), 200)
      setOk(false)
      return
    }
    if (!allowed.includes(session.role)) {
      // not authorized
      setTimeout(() => router.push('/'), 200)
      setOk(false)
      return
    }
    setOk(true)
  }, [allowed, router])

  if (ok === null) return <div className="p-6">Checking access...</div>
  if (ok === false) return <div className="p-6 text-red-600">Redirecting...</div>
  return <>{children}</>
}
