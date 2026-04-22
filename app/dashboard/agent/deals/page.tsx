import { redirect } from 'next/navigation'

export default function AgentDealsRedirectPage() {
  redirect('/dashboard/agent/crm?tab=deals')
}
