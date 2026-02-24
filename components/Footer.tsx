'use client'
import Link from 'next/link'

export default function Footer() {
  const buildSha = (process.env.NEXT_PUBLIC_BUILD_SHA || 'local').slice(0, 7)

  const publicLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/search', label: 'Buscar' },
    { href: '/agents', label: 'Agentes' },
    { href: '/brokers', label: 'Brokerages' },
    { href: '/contact', label: 'Contacto' },
    { href: '/disclosures', label: 'Avisos Legales' },
  ]
  const links = publicLinks

  return (
    <footer className="bg-[#FAFAFA] border-t mt-12 pt-8 pb-4 text-sm text-gray-600">
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Removed waitlist CTA banner to avoid showing waitlist prompts sitewide */}

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
            <div className="text-[11px] text-gray-500 mt-1">Build {buildSha}</div>
          </div>
        </div>
      </div>
    </footer>
  )
}
