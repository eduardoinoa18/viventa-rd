import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebaseAdmin'
import type { DocumentData, QuerySnapshot } from 'firebase-admin/firestore'

export const dynamic = 'force-dynamic'

type AgentDoc = {
  name?: string
  displayName?: string
  email?: string
  phone?: string
  city?: string
  area?: string
  photoURL?: string
  photo?: string
  profileImage?: string
  agentCode?: string
  professionalCode?: string
  rating?: number
  online?: boolean
  languages?: string
  status?: string
  approved?: boolean
  emailVerified?: boolean
  verified?: boolean
}

type AgentPublic = {
  id: string
  name: string
  email: string
  phone: string
  city: string
  area: string
  photo: string
  profileImage: string
  agentCode: string
  rating: number
  online: boolean
  languages: string
  status: string
  approved: boolean
  emailVerified: boolean
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb()
    if (!db) {
      return NextResponse.json({ ok: true, data: [] })
    }

    const { searchParams } = new URL(req.url)
    const limitParam = Number(searchParams.get('limit') || '200')
    const safeLimit = Math.min(Math.max(limitParam, 1), 500)

    const ref: any = db
      .collection('users')
      .where('role', '==', 'agent')
      .where('status', '==', 'active')
      .where('approved', '==', true)

    let snap: QuerySnapshot<DocumentData>
    try {
      snap = await ref.orderBy('updatedAt', 'desc').limit(safeLimit).get()
    } catch {
      try {
        snap = await ref.limit(safeLimit).get()
      } catch {
        snap = await db.collection('users').where('role', '==', 'agent').limit(safeLimit).get()
      }
    }

    const data: AgentPublic[] = snap.docs
      .map((d) => {
        const user = (d.data() || {}) as AgentDoc
        return {
          id: d.id,
          name: user.name || user.displayName || 'Agente',
          email: user.email || '',
          phone: user.phone || '',
          city: user.city || user.area || '',
          area: user.area || user.city || '',
          photo: user.photoURL || user.photo || user.profileImage || '',
          profileImage: user.profileImage || user.photoURL || user.photo || '',
          agentCode: user.agentCode || user.professionalCode || '',
          rating: Number(user.rating || 4.5),
          online: Boolean(user.online),
          languages: user.languages || 'Español',
          status: user.status || '',
          approved: Boolean(user.approved),
          emailVerified: Boolean(user.emailVerified || user.verified),
        }
      })
      .filter((u) => u.status === 'active' && u.approved)

    return NextResponse.json({ ok: true, data })
  } catch (error: any) {
    console.error('[api/agents] GET error:', error?.message)
    return NextResponse.json({ ok: false, error: 'Failed to load agents', data: [] }, { status: 500 })
  }
}
