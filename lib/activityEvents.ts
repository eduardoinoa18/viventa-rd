import type { Firestore } from 'firebase-admin/firestore'
import type { ActivityEventRecord, ActivityEventType, ActivityEntityType } from '@/lib/domain/activity'

export type EmitActivityEventInput = {
  type: ActivityEventType
  actorId?: string | null
  actorRole?: string | null
  entityType: ActivityEntityType
  entityId: string
  dealId?: string | null
  listingId?: string | null
  unitId?: string | null
  reservationId?: string | null
  transactionId?: string | null
  projectId?: string | null
  brokerId?: string | null
  agentId?: string | null
  buyerId?: string | null
  officeId?: string | null
  constructoraCode?: string | null
  metadata?: Record<string, unknown>
}

function buildActivityUrl(input: EmitActivityEventInput): string {
  const dealId = safeText(input.dealId || input.entityId)
  const listingId = safeText(input.listingId || input.entityId)

  switch (input.entityType) {
    case 'deal':
      return dealId ? `/dashboard/constructora/deals/${dealId}` : '/dashboard/constructora/deals'
    case 'reservation':
    case 'document':
      return dealId ? `/dashboard/constructora/deals/${dealId}` : '/dashboard/constructora/deals'
    case 'transaction':
    case 'commission':
      return '/dashboard/broker/transactions'
    case 'lead':
      return '/master/leads'
    case 'listing':
      return listingId ? `/listing/${listingId}` : '/dashboard/listings'
    default:
      return '/dashboard'
  }
}

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function dedupe(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((v) => safeText(v)).filter(Boolean)))
}

function asCurrency(value: unknown): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return '$0'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

function buildNotificationContent(input: EmitActivityEventInput): { title: string; body: string; url: string } {
  const dealUrl = input.dealId ? `/dashboard/constructora/deals/${input.dealId}` : '/dashboard/constructora/deals'
  const listingUrl = input.listingId ? `/listing/${input.listingId}` : '/dashboard/listings'
  const txUrl = '/dashboard/broker/transactions'

  switch (input.type) {
    case 'listing_created':
      return {
        title: 'Nuevo listado creado',
        body: String(input.metadata?.title || 'Se creó un nuevo listado.'),
        url: listingUrl,
      }
    case 'lead_contacted':
      return {
        title: 'Nuevo lead recibido',
        body: String(input.metadata?.buyerName || 'Un lead contactó la plataforma.'),
        url: '/master/leads',
      }
    case 'reservation_created':
      return {
        title: 'Nueva reserva registrada',
        body: 'Una reserva fue vinculada al flujo comercial.',
        url: dealUrl,
      }
    case 'deal_opened':
      return {
        title: 'Deal abierto',
        body: `Nuevo deal creado por ${input.actorRole || 'usuario'}.`,
        url: dealUrl,
      }
    case 'deal_updated':
      return {
        title: 'Deal actualizado',
        body: `Estado actual: ${String(input.metadata?.toStatus || input.metadata?.status || 'actualizado')}`,
        url: dealUrl,
      }
    case 'document_uploaded':
      return {
        title: 'Documento subido',
        body: String(input.metadata?.fileName || 'Se agregó un documento al deal.'),
        url: dealUrl,
      }
    case 'document_deleted':
      return {
        title: 'Documento eliminado',
        body: String(input.metadata?.fileName || 'Se eliminó un documento del deal.'),
        url: dealUrl,
      }
    case 'transaction_created':
      return {
        title: 'Transacción creada',
        body: `Valor: ${asCurrency(input.metadata?.salePrice)}`,
        url: txUrl,
      }
    case 'commission_paid':
      return {
        title: 'Comisión pagada',
        body: `Total: ${asCurrency(input.metadata?.totalCommission)}`,
        url: txUrl,
      }
    default:
      return {
        title: 'Actividad registrada',
        body: 'Hay una nueva actividad en la plataforma.',
        url: '/dashboard',
      }
  }
}

async function resolveRecipientIds(db: Firestore, input: EmitActivityEventInput): Promise<string[]> {
  const direct = dedupe([input.agentId, input.buyerId])
  const recipients = new Set<string>(direct)

  const officeId = safeText(input.officeId || input.brokerId)
  if (officeId) {
    const [brokerByBrokerId, brokerByBrokerageId] = await Promise.all([
      db.collection('users').where('brokerId', '==', officeId).limit(50).get(),
      db.collection('users').where('brokerageId', '==', officeId).limit(50).get(),
    ])
    for (const snap of [brokerByBrokerId, brokerByBrokerageId]) {
      for (const doc of snap.docs) {
        const user = doc.data() as Record<string, any>
        const role = safeText(user.role).toLowerCase()
        if (role === 'broker' || role === 'agent') recipients.add(doc.id)
      }
    }
  }

  const constructoraCode = safeText(input.constructoraCode)
  if (constructoraCode) {
    const [byConstructoraCode, byProfessionalCode] = await Promise.all([
      db.collection('users').where('constructoraCode', '==', constructoraCode).limit(50).get(),
      db.collection('users').where('professionalCode', '==', constructoraCode).limit(50).get(),
    ])
    for (const snap of [byConstructoraCode, byProfessionalCode]) {
      for (const doc of snap.docs) {
        const user = doc.data() as Record<string, any>
        if (safeText(user.role).toLowerCase() === 'constructora') recipients.add(doc.id)
      }
    }
  }

  const actorId = safeText(input.actorId)
  if (actorId) recipients.delete(actorId)

  return Array.from(recipients)
}

async function createNotificationsForEvent(db: Firestore, input: EmitActivityEventInput, eventId: string): Promise<void> {
  const recipientIds = await resolveRecipientIds(db, input)
  if (!recipientIds.length) return

  const { title, body, url } = buildNotificationContent(input)
  const now = new Date()
  const writes = recipientIds.map((userId) =>
    db.collection('notifications').add({
      userId,
      type: input.type,
      title,
      body,
      url,
      read: false,
      createdAt: now,
      data: {
        eventId,
        entityType: input.entityType,
        entityId: input.entityId,
        dealId: input.dealId || null,
      },
    })
  )

  await Promise.allSettled(writes)
}

export async function emitActivityEvent(db: Firestore, input: EmitActivityEventInput): Promise<string | null> {
  try {
    const payload = {
      type: input.type,
      url: buildActivityUrl(input),
      actorId: safeText(input.actorId) || null,
      actorRole: safeText(input.actorRole) || null,
      entityType: input.entityType,
      entityId: safeText(input.entityId),
      dealId: safeText(input.dealId) || null,
      listingId: safeText(input.listingId) || null,
      unitId: safeText(input.unitId) || null,
      reservationId: safeText(input.reservationId) || null,
      transactionId: safeText(input.transactionId) || null,
      projectId: safeText(input.projectId) || null,
      brokerId: safeText(input.brokerId) || null,
      agentId: safeText(input.agentId) || null,
      buyerId: safeText(input.buyerId) || null,
      officeId: safeText(input.officeId) || null,
      constructoraCode: safeText(input.constructoraCode) || null,
      metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
      createdAt: new Date(),
    }

    const created = await db.collection('activityEvents').add(payload)
    await createNotificationsForEvent(db, input, created.id)
    return created.id
  } catch (error) {
    console.error('[activityEvents] emit failed', error)
    return null
  }
}

export function toActivityEvent(id: string, data: Record<string, any>): ActivityEventRecord {
  return {
    id,
    type: data.type,
    url: data.url || null,
    actorId: data.actorId || null,
    actorRole: data.actorRole || null,
    entityType: data.entityType,
    entityId: data.entityId,
    dealId: data.dealId || null,
    listingId: data.listingId || null,
    unitId: data.unitId || null,
    reservationId: data.reservationId || null,
    transactionId: data.transactionId || null,
    projectId: data.projectId || null,
    brokerId: data.brokerId || null,
    agentId: data.agentId || null,
    buyerId: data.buyerId || null,
    officeId: data.officeId || null,
    constructoraCode: data.constructoraCode || null,
    metadata: data.metadata || {},
    createdAt: data.createdAt || null,
  }
}
