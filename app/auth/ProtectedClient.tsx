// app/auth/ProtectedClient.tsx
'use client'
import React, { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser } from '../../lib/authClient'

export default function ProtectedClient({ children, allowed = ['master_admin','admin'] }: { children: ReactNode, allowed?: string[] }) {
  const router = useRouter()
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    const u = getCurrentUser()
    if (!u) {
      // not logged in — redirect to login
      setTimeout(() => router.push('/login'), 200)
      setOk(false)
      return
    }
    if (!allowed.includes(u.role)) {
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
