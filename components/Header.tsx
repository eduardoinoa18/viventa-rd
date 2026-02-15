"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LocaleSwitcher from './LocaleSwitcher'
import NotificationCenter from './NotificationCenter'
import { useEffect, useState } from 'react'
import { getSession, clearSession } from '../lib/authSession'
import { FiMenu, FiX, FiLogOut, FiUser, FiHelpCircle } from 'react-icons/fi'

export default function Header() {
  const pathname = usePathname()
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
          {/* Back to Admin button for admins on user-facing pages */}
          {session && session.role === 'master_admin' && !pathname?.startsWith('/admin') && (
            <Link 
              href="/admin" 
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm bg-viventa-navy text-white rounded-lg font-medium hover:bg-viventa-ocean transition-all"
            >
              <span>Admin Panel</span>
            </Link>
          )}
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
              <Link href="/" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Inicio</Link>
              <Link href="/search" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Buscar</Link>
              <Link href="/agents" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Agentes</Link>
              <Link href="/brokers" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Brokerages</Link>
              <Link href="/contact" className="text-viventa-navy hover:text-viventa-turquoise transition-colors font-medium">Contacto</Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          {/* Back to Admin button for admins on user-facing pages */}
          {session && session.role === 'master_admin' && !pathname?.startsWith('/admin') && (
            <Link 
              href="/admin" 
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm bg-viventa-navy text-white rounded-lg font-medium hover:bg-viventa-ocean transition-all"
            >
              <span>Admin Panel</span>
            </Link>
          )}
          {session ? (
            <>
              {session.uid && session.role === 'master_admin' && <NotificationCenter userId={session.uid} />}
              {/* Online indicator (client-side presence) */}
              <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-full bg-green-50 border border-green-200">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-600"></span>
                </span>
                <span className="text-xs text-green-700 font-medium">En línea</span>
              </div>
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
              {/* Mobile: Show hamburger menu for non-logged users */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-viventa-sand transition-colors md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
                aria-label="Menu"
              >
                {mobileMenuOpen ? <FiX className="text-2xl text-viventa-navy" /> : <FiMenu className="text-2xl text-viventa-navy" />}
              </button>
              {/* Desktop: Show login/signup buttons */}
              <Link href="/login" className="px-4 py-2 min-h-[44px] hidden md:flex items-center justify-center text-sm border-2 border-viventa-ocean text-viventa-ocean rounded-lg font-bold hover:bg-viventa-ocean hover:text-white transition-all active:scale-95 touch-manipulation">Login</Link>
              <Link href="/signup" className="px-4 py-2 min-h-[44px] hidden md:flex items-center justify-center text-sm bg-gradient-to-r from-viventa-turquoise to-viventa-teal text-white rounded-lg font-bold hover:shadow-lg hover:scale-105 transition-all active:scale-95 touch-manipulation">Sign Up</Link>
            </>
          )}
        </div>
      </div>
      
      {/* Mobile menu for non-logged users */}
      {!session && mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg hover:bg-viventa-sand transition-colors font-medium text-viventa-navy"
            >
              Inicio
            </Link>
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg hover:bg-viventa-sand transition-colors font-medium text-viventa-navy"
            >
              Buscar Propiedades
            </Link>
            <Link
              href="/agents"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg hover:bg-viventa-sand transition-colors font-medium text-viventa-navy"
            >
              Agentes
            </Link>
            <Link
              href="/brokers"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg hover:bg-viventa-sand transition-colors font-medium text-viventa-navy"
            >
              Brokerages
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-3 rounded-lg hover:bg-viventa-sand transition-colors font-medium text-viventa-navy"
            >
              Contacto
            </Link>
            <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-center rounded-lg border-2 border-viventa-ocean text-viventa-ocean font-bold hover:bg-viventa-ocean hover:text-white transition-all"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-center rounded-lg bg-gradient-to-r from-viventa-turquoise to-viventa-teal text-white font-bold hover:shadow-lg transition-all"
              >
                Crear Cuenta
              </Link>
            </div>
          </div>
        </div>
      )}

      
      {/* Mobile dropdown menu for logged-in users */}
      {session && mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            <Link
              href="/search"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-viventa-sand transition-colors"
            >
              <FiUser className="text-xl text-viventa-ocean" />
              <span className="font-medium text-viventa-navy">Explorar propiedades</span>
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
