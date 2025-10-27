'use client'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-[#FAFAFA] border-t mt-12 pt-8 pb-4 text-sm text-gray-600">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <img src="/logo.svg" alt="VIVENTA" className="h-8 md:h-10" />
          </div>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-center">
            <Link href="/" className="hover:text-[#3BAFDA]">Inicio</Link>
            <Link href="/search" className="hover:text-[#3BAFDA]">Buscar</Link>
            <Link href="/agents" className="hover:text-[#3BAFDA]">Agentes</Link>
            <Link href="/profesionales" className="hover:text-[#3BAFDA]">Profesionales</Link>
            <Link href="/contact" className="hover:text-[#3BAFDA]">Contacto</Link>
          </div>
          <div className="text-xs text-center md:text-right">
            <div>© VIVENTA 2025</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
