import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default function SettingsRedirectPage() {
  const role = cookies().get('viventa_role')?.value

  if (!role) {
    redirect('/login?redirect=/settings')
  }

  if (role === 'master_admin' || role === 'admin') {
    redirect('/master/settings')
  }

  if (role === 'buyer' || role === 'user') {
    redirect('/dashboard')
  }

  redirect('/master')
}
