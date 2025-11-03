"use client"
import Link from 'next/link'
import LocaleSwitcher from './LocaleSwitcher'
import NotificationCenter from './NotificationCenter'
import { useEffect, useState } from 'react'
import { getSession, clearSession } from '../lib/authSession'
import { FiMenu, FiX, FiLogOut, FiUser, FiSettings, FiHelpCircle } from 'react-icons/fi'

export default function Header() {
  const [session, setSession] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  useEffect(() => { 
    setMounted(true)
    setSession(getSession()) 
  }, [])
  
  function logout(){ 
    clearSession()
    setSession(null)
    setMobileMenuOpen(false)
    if (typeof window !== 'undefined') window.location.href = '/'
  }
  
  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 bg-gradient-to-r from-white to-viventa-sand/20 shadow-md border-b border-viventa-turquoise/10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo.svg" alt="VIVENTA" className="h-10 sm:h-12 md:h-14" />
          </Link>
          <nav className="space-x-4 lg:space-x-6 hidden md:flex text-sm lg:text-base">
            <Link href="/" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Inicio</Link>
            <Link href="/search" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Buscar</Link>
            <Link href="/agents" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Agentes</Link>
            <Link href="/brokers" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Brokerages</Link>
            <Link href="/contact" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Contacto</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LocaleSwitcher />
            <Link href="/login" className="px-4 py-2 min-h-[44px] hidden sm:flex items-center justify-center text-sm border-2 border-viventa-ocean text-viventa-ocean rounded-lg font-bold hover:bg-viventa-ocean hover:text-white transition-all active:scale-95">Login</Link>
            <Link href="/signup" className="px-4 py-2 min-h-[44px] text-sm bg-gradient-to-r from-viventa-turquoise to-viventa-teal text-white rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all active:scale-95">Sign Up</Link>
          </div>
        </div>
      </header>
    )
  }
  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-white to-viventa-sand/20 shadow-md border-b border-viventa-turquoise/10">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img src="/logo.svg" alt="VIVENTA" className="h-10 sm:h-12 md:h-14" />
        </Link>
        <nav className="space-x-4 lg:space-x-6 hidden md:flex text-sm lg:text-base">
          {!session ? (
            <>
              <Link href="/" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Inicio</Link>
              <Link href="/search" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Buscar</Link>
              <Link href="/agents" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Agentes</Link>
              <Link href="/brokers" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Brokerages</Link>
              <Link href="/contact" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Contacto</Link>
            </>
          ) : (
            <>
              <Link href="/search" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Explorar</Link>
              <Link href="/favorites" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Favoritos</Link>
              <Link href="/social" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Social</Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {session ? (
            <>
              {session.uid && <NotificationCenter userId={session.uid} />}
              {/* Hamburger menu for logged-in users on mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-viventa-sand transition-colors md:hidden"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <FiX className="text-2xl text-viventa-navy" /> : <FiMenu className="text-2xl text-viventa-navy" />}
              </button>
              {/* Desktop user menu */}
              <div className="hidden md:flex items-center gap-2">
                <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm border-2 border-viventa-ocean text-viventa-ocean rounded-lg font-semibold hover:bg-viventa-ocean hover:text-white transition-all">
                  <FiUser className="text-lg" />
                  <span>Perfil</span>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-viventa-sunset text-white rounded-lg font-semibold hover:bg-viventa-sunset-light transition-all"
                >
                  <FiLogOut />
                  <span>Salir</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="px-4 py-2 min-h-[44px] hidden sm:flex items-center justify-center text-sm border-2 border-viventa-ocean text-viventa-ocean rounded-lg font-bold hover:bg-viventa-ocean hover:text-white transition-all active:scale-95">Login</Link>
              <Link href="/signup" className="px-4 py-2 min-h-[44px] text-sm bg-gradient-to-r from-viventa-turquoise to-viventa-teal text-white rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all active:scale-95">Sign Up</Link>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile dropdown menu for logged-in users */}
      {session && mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-viventa-sand transition-colors"
            >
              <FiUser className="text-xl text-viventa-ocean" />
              <span className="font-medium text-viventa-navy">Mi Perfil</span>
            </Link>
            <Link
              href="/dashboard/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-viventa-sand transition-colors"
            >
              <FiSettings className="text-xl text-viventa-ocean" />
              <span className="font-medium text-viventa-navy">Configuración</span>
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-viventa-sand transition-colors"
            >
              <FiHelpCircle className="text-xl text-viventa-ocean" />
              <span className="font-medium text-viventa-navy">Ayuda</span>
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-viventa-sunset/10 transition-colors w-full text-left"
            >
              <FiLogOut className="text-xl text-viventa-sunset" />
              <span className="font-medium text-viventa-sunset">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
