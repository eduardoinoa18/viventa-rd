import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto | VIVENTA - Propiedades en República Dominicana',
  description: 'Ponte en contacto con VIVENTA para consultas sobre propiedades, servicios inmobiliarios, agentes o brokers en República Dominicana.',
  alternates: {
    canonical: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/contact',
  },
  openGraph: {
    title: 'Contacto | VIVENTA',
    description: 'Estamos aquí para ayudarte con todas tus preguntas sobre bienes raíces en RD.',
    url: (process.env.NEXT_PUBLIC_SITE_URL || 'https://viventa-rd.com') + '/contact',
    siteName: 'VIVENTA',
    locale: 'es_DO',
    type: 'website',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
