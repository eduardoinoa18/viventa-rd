"use client"
import Link from 'next/link'
import LocaleSwitcher from './LocaleSwitcher'
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
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <img src="/logo.svg" alt="VIVENTA" className="h-8" />
            <span className="font-bold text-2xl text-[#0B2545]">VIVENTA</span>
          </Link>
          <nav className="space-x-6 hidden md:flex">
            <Link href="/" className="hover:text-[#3BAFDA]">Inicio</Link>
            <Link href="/search" className="hover:text-[#3BAFDA]">Buscar</Link>
            <Link href="/agents" className="hover:text-[#3BAFDA]">Agentes</Link>
            <Link href="/profesionales" className="hover:text-[#3BAFDA]">Profesionales</Link>
            <Link href="/dashboard" className="hover:text-[#3BAFDA]">Dashboard</Link>
            <Link href="/contact" className="hover:text-[#3BAFDA]">Contacto</Link>
            <Link href="/admin" className="text-gray-400 hover:text-[#0B2545]" style={{fontSize:'10px'}}>Admin</Link>
          </nav>
          <div className="flex items-center space-x-3">
            <LocaleSwitcher />
            <Link href="/login" className="px-4 py-2 border rounded font-semibold">Login</Link>
            <Link href="/signup" className="px-4 py-2 bg-[#00A676] text-white rounded font-semibold">Sign Up</Link>
          </div>
        </div>
      </header>
    )
  }
  return (
    <header className="sticky top-0 z-20 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo.svg" alt="VIVENTA" className="h-8" />
          <span className="font-bold text-2xl text-[#0B2545]">VIVENTA</span>
        </Link>
        <nav className="space-x-6 hidden md:flex">
          <Link href="/" className="hover:text-[#3BAFDA]">Inicio</Link>
          <Link href="/search" className="hover:text-[#3BAFDA]">Buscar</Link>
          <Link href="/agents" className="hover:text-[#3BAFDA]">Agentes</Link>
          <Link href="/profesionales" className="hover:text-[#3BAFDA]">Profesionales</Link>
          <Link href="/dashboard" className="hover:text-[#3BAFDA]">Dashboard</Link>
          <Link href="/contact" className="hover:text-[#3BAFDA]">Contacto</Link>
          <Link href="/admin/login" className="text-gray-400 hover:text-[#0B2545]" style={{fontSize:'10px'}}>Master Admin</Link>
        </nav>
        <div className="flex items-center space-x-3">
          <LocaleSwitcher />
          {session ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 border rounded font-semibold">Dashboard</Link>
              <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded font-semibold">Logout</button>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 border rounded font-semibold">Login</Link>
              <Link href="/signup" className="px-4 py-2 bg-[#00A676] text-white rounded font-semibold">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
