import { redirect } from 'next/navigation'

export default function AgentTasksRedirectPage() {
  redirect('/dashboard/agent/crm?tab=tasks')
}
