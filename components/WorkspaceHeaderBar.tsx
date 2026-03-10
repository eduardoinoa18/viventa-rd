'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FiLogOut, FiArrowLeft } from 'react-icons/fi'
import NotificationCenter from '@/components/NotificationCenter'
import { clearSession, getSession, type UserSession } from '@/lib/authSession'

type WorkspaceHeaderBarProps = {
  eyebrow: string
  title: string
  subtitle: string
  backHref?: string
}

export default function WorkspaceHeaderBar({ eyebrow, title, subtitle, backHref = '/dashboard' }: WorkspaceHeaderBarProps) {
  const router = useRouter()
  const [session, setSession] = useState<UserSession | null>(null)

  useEffect(() => {
    setSession(getSession())
  }, [])

  function logout() {
    clearSession()
    router.push('/')
  }

  return (
    <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{eyebrow}</div>
          <h1 className="text-xl font-bold text-[#0B2545] sm:text-2xl">{title}</h1>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#0B2545] hover:bg-gray-50"
          >
            <FiArrowLeft /> Volver
          </Link>
          {session?.uid ? <NotificationCenter userId={session.uid} /> : null}
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0B2545] px-3 py-2 text-sm font-medium text-white hover:bg-[#133a66]"
          >
            <FiLogOut /> Salir
          </button>
        </div>
      </div>
    </div>
  )
}
