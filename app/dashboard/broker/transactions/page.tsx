import { redirect } from 'next/navigation'

export default function BrokerTransactionsRedirectPage() {
  redirect('/dashboard/broker/crm?tab=transactions')
}
