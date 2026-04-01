/**
 * Reusable Legal Data Disclaimer Component
 * Displays platform liability and professional responsibility notices
 * Variants: "public" (public listings) | "professional" (MLS/professional sheets)
 */

import type { ReactNode } from 'react'

interface LegalDataDisclaimerProps {
  variant?: 'public' | 'professional'
  className?: string
}

export default function LegalDataDisclaimer({
  variant = 'public',
  className = '',
}: LegalDataDisclaimerProps) {
  if (variant === 'professional') {
    // Professional/MLS disclaimer for agents, brokers, etc.
    return (
      <div
        className={`rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4 text-xs leading-relaxed text-amber-900 space-y-1.5 ${className}`.trim()}
      >
        <p>
          <strong>Confidencialidad profesional:</strong> Esta ficha MLS contiene información privada, instrucciones de showing y notas operativas. Úsala
          solo para fines profesionales autorizados. No compartas con terceros sin permiso del listante.
        </p>
        <p>
          <strong>Responsabilidad profesional:</strong> VIVENTA es una plataforma tecnológica que conecta profesionales inmobiliarios. Eres responsable
          de validar toda la información, respetar confidencialidad, cumplir leyes locales y ejercer diligencia profesional en todas las transacciones.
        </p>
        <p>
          <strong>Datos y cambios:</strong> La información en esta ficha está sujeta a cambios. Verifica directamente con el broker o agente antes de
          cualquier acción. VIVENTA no se responsabiliza por errores, omisiones o cambios no reportados.
        </p>
      </div>
    )
  }

  // Default: Public listing disclaimer
  return (
    <div
      className={`rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4 text-xs leading-relaxed text-amber-900 space-y-1.5 ${className}`.trim()}
    >
      <p>
        <strong>Aviso legal y de datos:</strong> La información en este listado es referencial y proporcionada por el agente o broker. Está sujeta a
        cambios sin previo aviso. VIVENTA no garantiza exactitud ni se responsabiliza por errores u omisiones.
      </p>
      <p>
        <strong>Plataforma tecnológica:</strong> VIVENTA opera como plataforma de conexión tecnológica, no como asesor legal, financiero o profesional.
        No estamos involucrados en transacciones. Cualquier consejo debe venir de profesionales autorizados.
      </p>
      <p>
        <strong>Validación independiente:</strong> Antes de reservar, comprar o alquilar, valida independientemente toda la información con profesionales
        calificados, incluidos abogados, tasadores e inspectores.
      </p>
    </div>
  )
}
