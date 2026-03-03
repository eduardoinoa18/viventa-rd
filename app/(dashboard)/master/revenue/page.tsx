import { requireMasterAdmin } from '@/lib/auth/guards'
import RevenueClient from './RevenueClient'

export const dynamic = 'force-dynamic'

export default async function MasterRevenuePage() {
  await requireMasterAdmin()

  return <RevenueClient />
}
