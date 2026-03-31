import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import { getSessionFromRequest } from '@/lib/auth/session'
import { getListingAccessUserContext } from '@/lib/listingOwnership'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

export async function GET(req: Request) {
  try {
    const db = getAdminDb()
    if (!db) return NextResponse.json({ ok: false, error: 'Server config error' }, { status: 500 })

    const session = await getSessionFromRequest(req)
    if (!session?.uid) return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })

    const context = await getListingAccessUserContext(db, session.uid, (session.role as any) || 'buyer')
    if (context.role !== 'broker' && context.role !== 'agent') {
      return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
    }
    if (!context.officeId) {
      return NextResponse.json({ ok: false, error: 'Broker office assignment required' }, { status: 403 })
    }

    const [byBrokerId, byBrokerageId, pendingInviteSnap] = await Promise.all([
      db.collection('users').where('brokerId', '==', context.officeId).limit(400).get(),
      db.collection('users').where('brokerageId', '==', context.officeId).limit(400).get(),
      db.collection('invitations').where('officeId', '==', context.officeId).where('status', '==', 'pending').limit(100).get(),
    ])

    const membersMap = new Map<string, Record<string, any>>()
    for (const snap of [byBrokerId, byBrokerageId]) {
      for (const doc of snap.docs) {
        membersMap.set(doc.id, { id: doc.id, ...(doc.data() as Record<string, any>) })
      }
    }

    membersMap.set(context.uid, {
      id: context.uid,
      role: context.role,
      name: context.name,
      email: context.email,
      status: 'active',
    })

    const members = Array.from(membersMap.values())
      .filter((member) => ['agent', 'broker'].includes(safeText(member.role).toLowerCase()))
      .map((member) => ({
        id: safeText(member.id),
        name: safeText(member.name || member.displayName || member.email || 'Miembro'),
        role: safeText(member.role || 'agent').toLowerCase(),
        status: (() => {
          const normalizedStatus = safeText(member.status || 'active').toLowerCase() || 'active'
          return normalizedStatus === 'invited' ? 'pending' : normalizedStatus
        })(),
        email: safeText(member.email),
      }))

    const activeMembers = members.filter((member) => member.status === 'active').length
    const pendingMemberEmails = new Set(
      members
        .filter((member) => member.status === 'pending')
        .map((member) => safeText(member.email).toLowerCase())
        .filter(Boolean)
    )

    const pendingInviteRows = pendingInviteSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Record<string, any>),
    })) as Array<Record<string, any> & { id: string }>

    const pendingInvites = pendingInviteRows
      .filter((invite) => ['agent', 'broker'].includes(safeText(invite.role || invite.inviteType).toLowerCase()))
      .map((invite) => ({
        id: safeText(invite.id),
        name: safeText(invite.name || invite.email || 'Invitacion pendiente'),
        email: safeText(invite.email),
        role: safeText(invite.role || invite.inviteType || 'agent').toLowerCase(),
        status: 'pending',
        expiresAt: invite.expiresAt?.toDate?.()?.toISOString?.() || safeText(invite.expiresAt),
      }))
      .filter((invite) => !pendingMemberEmails.has(safeText(invite.email).toLowerCase()))

    const pendingMembers = members.filter((member) => member.status === 'pending').length + pendingInvites.length

    return NextResponse.json({
      ok: true,
      officeId: context.officeId,
      summary: {
        totalMembers: members.length,
        activeMembers,
        pendingMembers,
      },
      members: members.slice(0, 50),
      pendingInvites: pendingInvites.slice(0, 50),
    })
  } catch (error: any) {
    console.error('[api/broker/team] GET error', error)
    return NextResponse.json({ ok: false, error: 'Failed to load broker team' }, { status: 500 })
  }
}
