'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#FAFAFA] border-t mt-12 pt-8 pb-4 text-sm text-gray-600">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <img src="/logo.svg" alt="VIVENTA" className="h-6" />
          <span className="font-bold text-lg text-[#0B2545]">VIVENTA</span>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Link href="/">Inicio</Link>
          <Link href="/search">Buscar</Link>
          <Link href="/agents">Agentes</Link>
          <Link href="/profesionales" className="font-semibold text-[#3BAFDA]">Profesionales</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/contact">Contacto</Link>
        </div>
        <div className="mt-4 md:mt-0 text-xs text-right">
          <Link href="/admin" className="text-gray-400 hover:text-[#0B2545]" style={{fontSize:'10px'}}>Master Admin Login</Link>
          <div className="mt-1">© VIVENTA 2025</div>
        </div>
      </div>
    </footer>
  )
}
