import { redirect } from 'next/navigation'

export default function BrokerTasksRedirectPage() {
  redirect('/dashboard/broker/crm?tab=tasks')
}
