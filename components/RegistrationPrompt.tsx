// components/RegistrationPrompt.tsx
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getSession } from '@/lib/authSession'

const LS_KEY = 'registration_prompt_last_dismissed'

export default function RegistrationPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const ses = getSession()
    if (ses?.uid) return // logged-in users should not see it
    try {
      const last = localStorage.getItem(LS_KEY)
      const now = Date.now()
      const weekMs = 7 * 24 * 60 * 60 * 1000
      if (!last || now - Number(last) > weekMs) {
        setShow(true)
      }
    } catch {}
  }, [])

  if (!show) return null

  function dismiss() {
    try { localStorage.setItem(LS_KEY, String(Date.now())) } catch {}
    setShow(false)
  }

  return (
    <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[95%] sm:w-[680px]">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <div className="text-lg sm:text-xl font-bold text-[#0B2545]">Crea tu cuenta en VIVENTA</div>
          <div className="text-sm text-gray-600 mt-1">Guarda favoritos, recibe alertas y contacta agentes más rápido.</div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/signup" className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-[#00A676] text-white font-semibold hover:bg-[#008F64] text-center">Registrarme</Link>
          <Link href="/apply" className="flex-1 sm:flex-none px-4 py-2 rounded-lg border border-[#0B2545] text-[#0B2545] font-semibold hover:bg-[#0B2545] hover:text-white text-center">Soy Agente</Link>
          <button onClick={dismiss} className="px-3 py-2 text-gray-500 hover:text-gray-700" aria-label="Cerrar">✕</button>
        </div>
      </div>
    </div>
  )
}
