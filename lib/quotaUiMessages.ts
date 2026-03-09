export type QuotaApiErrorPayload = {
  error?: string
  code?: string
  quota?: {
    used?: number | null
    limit?: number | null
    officeId?: string | null
  }
}

type QuotaMessageContext = 'listing' | 'agent-seat'

interface MapQuotaErrorOptions {
  context: QuotaMessageContext
  fallbackMessage: string
}

export interface QuotaUiIssue {
  message: string
  ctaHref?: string
  ctaLabel?: string
}

export function mapOfficeQuotaIssue(payload: QuotaApiErrorPayload, options: MapQuotaErrorOptions): QuotaUiIssue {
  const { context, fallbackMessage } = options
  const code = String(payload?.code || '').trim().toUpperCase()
  const used = Number(payload?.quota?.used)
  const limit = Number(payload?.quota?.limit)
  const hasQuota = Number.isFinite(used) && Number.isFinite(limit)

  if (code === 'OFFICE_SUBSCRIPTION_INACTIVE') {
    return {
      message: 'La suscripción de la oficina está inactiva. Reactívala para continuar.',
      ctaHref: context === 'listing' ? '/dashboard/billing' : '/master/offices',
      ctaLabel: 'Ver suscripción',
    }
  }

  if (code === 'OFFICE_ASSIGNMENT_REQUIRED') {
    return {
      message: 'La cuenta no tiene oficina asignada. Asigna una oficina antes de continuar.',
      ctaHref: context === 'listing' ? '/dashboard/settings' : '/master/users',
      ctaLabel: 'Gestionar asignación',
    }
  }

  if (code === 'OFFICE_NOT_FOUND') {
    return {
      message: 'No se encontró la oficina asociada. Verifica la asignación de oficina.',
      ctaHref: context === 'listing' ? '/dashboard/settings' : '/master/offices',
      ctaLabel: 'Revisar oficinas',
    }
  }

  if (code === 'OFFICE_LISTINGS_LIMIT_REACHED') {
    return {
      message: hasQuota
        ? `La oficina alcanzó el límite de publicaciones (${used}/${limit}). Archiva listados activos o mejora tu plan.`
        : 'La oficina alcanzó el límite de publicaciones. Archiva listados activos o mejora tu plan.',
      ctaHref: '/dashboard/billing',
      ctaLabel: 'Mejorar plan',
    }
  }

  if (code === 'OFFICE_AGENT_LIMIT_REACHED') {
    return {
      message: hasQuota
        ? `La oficina alcanzó el límite de agentes (${used}/${limit}). Libera cupos o mejora tu plan.`
        : 'La oficina alcanzó el límite de agentes. Libera cupos o mejora tu plan.',
      ctaHref: '/master/offices',
      ctaLabel: 'Gestionar plan',
    }
  }

  if (context === 'listing' && code.startsWith('OFFICE_')) {
    return {
      message: 'No se pudo publicar el listado por restricciones de la oficina.',
      ctaHref: '/dashboard/billing',
      ctaLabel: 'Ver facturación',
    }
  }

  if (context === 'agent-seat' && code.startsWith('OFFICE_')) {
    return {
      message: 'No se pudo crear/aprobar el agente por restricciones de la oficina.',
      ctaHref: '/master/offices',
      ctaLabel: 'Revisar oficina',
    }
  }

  return { message: String(payload?.error || '').trim() || fallbackMessage }
}

export function mapOfficeQuotaError(payload: QuotaApiErrorPayload, options: MapQuotaErrorOptions): string {
  return mapOfficeQuotaIssue(payload, options).message
}
