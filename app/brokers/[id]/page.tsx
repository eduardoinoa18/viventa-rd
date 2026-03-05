import { notFound, permanentRedirect } from 'next/navigation'
import { getAdminDb } from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

function safeText(value: unknown): string {
  return String(value ?? '').trim()
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

export default async function LegacyBrokerIdPage({ params }: { params: { id: string } }) {
  const db = getAdminDb()
  if (!db) notFound()

  const id = safeText(params.id)
  if (!id) notFound()

  const doc = await db.collection('users').doc(id).get()
  if (!doc.exists) {
    permanentRedirect(`/broker/${encodeURIComponent(id)}`)
  }

  const data = doc.data() || {}
  if (safeText(data.role).toLowerCase() !== 'broker') notFound()
  if (safeText(data.status).toLowerCase() !== 'active' || data.approved !== true || data.publicProfileEnabled === false) notFound()

  const slug =
    safeText(data.slug) ||
    slugify(safeText(data.company || data.name || data.displayName || doc.id)) ||
    doc.id

  permanentRedirect(`/broker/${encodeURIComponent(slug)}`)
}
