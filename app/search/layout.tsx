import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Buscar Propiedades en República Dominicana | VIVENTA',
  description: 'Explora casas, apartamentos, villas y proyectos en venta o alquiler en toda la República Dominicana con filtros avanzados.',
  alternates: {
    canonical: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/search',
  },
  openGraph: {
    title: 'Buscar Propiedades | VIVENTA',
    description: 'Búsqueda inmobiliaria con filtros avanzados en República Dominicana.',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/search',
    siteName: 'VIVENTA',
    locale: 'es_DO',
    type: 'website',
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
