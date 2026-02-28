import { requireMasterAdmin } from '@/lib/auth/guards'
import OverviewClient from './OverviewClient'

export const dynamic = 'force-dynamic'

export default async function MasterOverviewPage() {
  await requireMasterAdmin()

  return <OverviewClient />
}
