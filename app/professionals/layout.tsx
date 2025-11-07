import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'VIVENTA para Profesionales | MLS Inmobiliario en República Dominicana',
  description: 'Plataforma MLS profesional para agentes, brokers y desarrolladores en República Dominicana. Planes, precios y herramientas colaborativas.',
  alternates: {
    canonical: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/professionals',
  },
  openGraph: {
    title: 'VIVENTA para Profesionales | MLS en RD',
    description: 'Únete a la plataforma inmobiliaria colaborativa líder en República Dominicana.',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/professionals',
    siteName: 'VIVENTA',
    locale: 'es_DO',
    type: 'website',
  },
}

export default function ProfessionalsLayout({ children }: { children: React.ReactNode }) {
  return children
}
