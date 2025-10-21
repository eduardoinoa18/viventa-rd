'use client'
import Link from 'next/link'
import LocaleSwitcher from './LocaleSwitcher'

export default function Header() {
  return (
    <header className="sticky top-0 z-20 bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <img src="/logo.svg" alt="VIVENTA" className="h-8" />
          <span className="font-bold text-2xl text-[#0B2545]">VIVENTA</span>
        </Link>
        <nav className="space-x-6 hidden md:flex">
          <Link href="/" className="hover:text-[#3BAFDA]">Comprar</Link>
          <Link href="/" className="hover:text-[#3BAFDA]">Alquilar</Link>
          <Link href="/" className="hover:text-[#3BAFDA]">Proyectos</Link>
          <Link href="/agents" className="hover:text-[#3BAFDA]">Agentes</Link>
          <Link href="/about" className="hover:text-[#3BAFDA]">Nosotros</Link>
          <Link href="/contact" className="hover:text-[#3BAFDA]">Contacto</Link>
        </nav>
        <div className="flex items-center space-x-3">
          <LocaleSwitcher />
          <Link href="/auth" className="px-4 py-2 bg-[#00A676] text-white rounded font-semibold">Login / Sign Up</Link>
        </div>
      </div>
    </header>
  )
}
