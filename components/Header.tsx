"use client"
import Link from 'next/link'
import LocaleSwitcher from './LocaleSwitcher'
import CurrencySwitcher from './CurrencySwitcher'
import NotificationCenter from './NotificationCenter'
import { useEffect, useState } from 'react'
import { getSession, clearSession } from '../lib/authSession'

export default function Header() {
  const [session, setSession] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => { 
    setMounted(true)
    setSession(getSession()) 
  }, [])
  
  function logout(){ 
    clearSession()
    setSession(null)
    if (typeof window !== 'undefined') window.location.href = '/'
  }
  
  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo.svg" alt="VIVENTA" className="h-10 sm:h-12 md:h-14" />
          </Link>
          <nav className="space-x-4 lg:space-x-6 hidden md:flex text-sm lg:text-base">
            <Link href="/" className="hover:text-[#3BAFDA]">Inicio</Link>
            <Link href="/search" className="hover:text-[#3BAFDA]">Buscar</Link>
            <Link href="/agents" className="hover:text-[#3BAFDA]">Agentes</Link>
            <Link href="/brokers" className="hover:text-[#3BAFDA]">Brokerages</Link>
            <Link href="/contact" className="hover:text-[#3BAFDA]">Contacto</Link>
          </nav>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <CurrencySwitcher />
            <LocaleSwitcher />
            <Link href="/login" className="px-4 py-2 min-h-[44px] min-w-[68px] flex items-center justify-center text-sm border-2 border-viventa-navy text-viventa-navy rounded-lg font-bold hover:bg-viventa-navy hover:text-white transition-all active:scale-95">Login</Link>
            <Link href="/signup" className="px-4 py-2 min-h-[44px] text-sm bg-gradient-to-r from-viventa-teal to-viventa-cyan text-white rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all active:scale-95">Sign Up</Link>
          </div>
        </div>
      </header>
    )
  }
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo.svg" alt="VIVENTA" className="h-10 sm:h-12 md:h-14" />
        </Link>
        <nav className="space-x-4 lg:space-x-6 hidden md:flex text-sm lg:text-base">
          {!session ? (
            <>
              <Link href="/" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Inicio</Link>
              <Link href="/search" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Buscar</Link>
              <Link href="/agents" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Agentes</Link>
              <Link href="/brokers" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Brokerages</Link>
              <Link href="/contact" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Contacto</Link>
            </>
          ) : (
            <>
              <Link href="/dashboard" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Dashboard</Link>
              <Link href="/search" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Explorar</Link>
              <Link href="/favorites" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Favoritos</Link>
              <Link href="/dashboard/social" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Social</Link>
              <Link href="/contact" className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">Soporte</Link>
            </>
          )}
        </nav>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <CurrencySwitcher />
          <LocaleSwitcher />
          {session ? (
            <>
              {session.uid && <NotificationCenter userId={session.uid} />}
              <Link href="/dashboard" className="px-3 py-2 text-sm border rounded font-semibold hover:bg-gray-50 transition hidden sm:inline-block">Dashboard</Link>
              <button onClick={logout} className="px-3 py-2 text-sm bg-red-500 text-white rounded font-semibold hover:bg-red-600 transition hidden md:inline-block">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-3 py-2 min-h-[44px] min-w-[60px] flex items-center justify-center text-sm border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition active:scale-95">Login</Link>
              <Link href="/signup" className="px-3 py-2 min-h-[44px] text-sm bg-[#00A676] text-white rounded-lg font-semibold hover:bg-[#008f5f] transition active:scale-95 shadow-sm">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
