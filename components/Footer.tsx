'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getSession } from '../lib/authSession'

export default function Footer() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [role, setRole] = useState<string>('user')

  useEffect(() => {
    const s = getSession()
    if (s) { setLoggedIn(true); setRole(s.role) }
  }, [])

  const userLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/favorites', label: 'Favoritos' },
    { href: '/search', label: 'Buscar' },
    { href: '/contact', label: 'Soporte' },
  ]

  const publicLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/search', label: 'Buscar' },
    { href: '/agents', label: 'Agentes' },
    { href: '/profesionales', label: 'Profesionales' },
    { href: '/contact', label: 'Contacto' },
    { href: '/disclosures', label: 'Avisos Legales' },
  ]

  const links = loggedIn ? userLinks : publicLinks

  return (
    <footer className="bg-[#FAFAFA] border-t mt-12 pt-8 pb-4 text-sm text-gray-600">
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Waitlist CTA */}
        {!loggedIn && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 mb-8 text-center">
            <h3 className="text-xl font-bold text-gray-800 mb-2">🚀 Únete a la Lista de Espera Beta</h3>
            <p className="text-gray-600 mb-4">Obtén acceso anticipado a nuevas funciones, actualizaciones exclusivas y beneficios especiales del programa beta.</p>
            <button
              onClick={() => {
                document.dispatchEvent(new Event('viventa-open-waitlist'))
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition-all transform hover:scale-105"
            >
              Reservar mi Cupo Beta →
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/logo.svg" alt="VIVENTA" className="h-8 md:h-10" />
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-center">
            {links.map(l => (
              <Link key={l.href} href={l.href} className="text-viventa-navy hover:text-viventa-teal transition-colors font-medium">{l.label}</Link>
            ))}
          </div>
          <div className="text-xs text-center md:text-right">
            <div>© VIVENTA 2025</div>
          </div>
        </div>
        {/* Master Admin link - subtle in corner */}
        {!loggedIn && (
          <Link
            href="/admin/login"
            aria-label="Master Admin Login"
            className="hidden md:inline-block absolute bottom-1 right-2 text-[11px] text-gray-400 hover:text-gray-700 opacity-60 hover:opacity-100 transition-opacity"
          >
            Master Admin
          </Link>
        )}
      </div>
    </footer>
  )
}
