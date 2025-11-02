// components/AdminTopbar.tsx
'use client'
import React from 'react'
import { getCurrentUser, logout } from '../lib/authClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminTopbar() {
  const router = useRouter()
  const u = getCurrentUser()

  async function doLogout() {
    await logout()
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
      <div className="container mx-auto flex items-center justify-between p-3">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00A676] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">V</span>
          </div>
          <div className="text-lg font-semibold text-[#0B2545]">VIVENTA — Admin</div>
        </Link>
        <div className="flex items-center gap-4">
          <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">🔔 Notifications</button>
          <div className="text-sm">
            {u ? (
              <div className="flex items-center gap-3">
                <div className="text-gray-700">{u.name} <span className="text-xs text-gray-500">({u.role})</span></div>
                <button onClick={doLogout} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Logout</button>
              </div>
            ) : (
              <div className="text-gray-500">Not signed in</div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
