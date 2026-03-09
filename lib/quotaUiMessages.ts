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

export function mapOfficeQuotaError(payload: QuotaApiErrorPayload, options: MapQuotaErrorOptions): string {
  const { context, fallbackMessage } = options
  const code = String(payload?.code || '').trim().toUpperCase()
  const used = Number(payload?.quota?.used)
  const limit = Number(payload?.quota?.limit)
  const hasQuota = Number.isFinite(used) && Number.isFinite(limit)

  if (code === 'OFFICE_SUBSCRIPTION_INACTIVE') {
    return 'La suscripción de la oficina está inactiva. Reactívala para continuar.'
  }

  if (code === 'OFFICE_ASSIGNMENT_REQUIRED') {
    return 'La cuenta no tiene oficina asignada. Asigna una oficina antes de continuar.'
  }

  if (code === 'OFFICE_NOT_FOUND') {
    return 'No se encontró la oficina asociada. Verifica la asignación de oficina.'
  }

  if (code === 'OFFICE_LISTINGS_LIMIT_REACHED') {
    if (hasQuota) {
      return `La oficina alcanzó el límite de publicaciones (${used}/${limit}). Archiva listados activos o mejora tu plan.`
    }
    return 'La oficina alcanzó el límite de publicaciones. Archiva listados activos o mejora tu plan.'
  }

  if (code === 'OFFICE_AGENT_LIMIT_REACHED') {
    if (hasQuota) {
      return `La oficina alcanzó el límite de agentes (${used}/${limit}). Libera cupos o mejora tu plan.`
    }
    return 'La oficina alcanzó el límite de agentes. Libera cupos o mejora tu plan.'
  }

  if (context === 'listing' && code.startsWith('OFFICE_')) {
    return 'No se pudo publicar el listado por restricciones de la oficina.'
  }

  if (context === 'agent-seat' && code.startsWith('OFFICE_')) {
    return 'No se pudo crear/aprobar el agente por restricciones de la oficina.'
  }

  return String(payload?.error || '').trim() || fallbackMessage
}
