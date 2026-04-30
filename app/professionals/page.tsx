import type { Metadata } from 'next'
import ProfessionalsLanding from './ProfessionalsContent'

export const metadata: Metadata = {
  title: 'VIVENTA para Profesionales | Agentes, Brokers y Constructoras en RD',
  description: 'La plataforma MLS mas completa de Republica Dominicana.',
  openGraph: {
    title: 'VIVENTA para Profesionales',
    description: 'Potencia tu negocio inmobiliario con la plataforma MLS lider en la Republica Dominicana.',
    url: 'https://viventa-rd.com/professionals',
    type: 'website',
  },
}

export default function ProfessionalsPage() {
  return <ProfessionalsLanding />
}
