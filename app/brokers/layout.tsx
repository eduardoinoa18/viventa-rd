import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Brokers Inmobiliarios en República Dominicana | VIVENTA',
  description: 'Conecta con brokerages inmobiliarios certificados y líderes en Santo Domingo, Punta Cana, Santiago y toda República Dominicana.',
  alternates: {
    canonical: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/brokers',
  },
  openGraph: {
    title: 'Brokers en República Dominicana | VIVENTA',
    description: 'Directorio de brokerages verificados con equipos profesionales.',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/brokers',
    siteName: 'VIVENTA',
    locale: 'es_DO',
    type: 'website',
  },
}

export default function BrokersLayout({ children }: { children: React.ReactNode }) {
  return children
}
