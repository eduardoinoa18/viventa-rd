// app/admin/people/brokers/page.tsx
'use client'
// app/admin/people/brokers/page.tsx
import { redirect } from 'next/navigation'

export default function PeopleBrokersPage() {
  redirect('/admin/people?tab=brokers')
}
