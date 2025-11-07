import { redirect } from 'next/navigation'

export default function LegacyPropertyRoute({ params }: { params: { id: string } }) {
  // Canonical detail route is /listing/[id]
  redirect(`/listing/${params.id}`)
}
