import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Agentes Inmobiliarios en República Dominicana | VIVENTA',
  description: 'Conecta con agentes verificados en Santo Domingo, Punta Cana, Santiago y toda la República Dominicana.',
  alternates: {
    canonical: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/agents',
  },
  openGraph: {
    title: 'Agentes en República Dominicana | VIVENTA',
    description: 'Directorio de agentes inmobiliarios verificados.',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/agents',
    siteName: 'VIVENTA',
    locale: 'es_DO',
    type: 'website',
  },
}

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return children
}
