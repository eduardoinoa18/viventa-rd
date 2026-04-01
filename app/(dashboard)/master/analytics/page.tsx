import { requireMasterAdmin } from '@/lib/auth/guards'
import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function MasterAnalyticsPage() {
  await requireMasterAdmin()

  return <AnalyticsClient />
}
