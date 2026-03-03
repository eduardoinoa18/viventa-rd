import { requireMasterAdmin } from '@/lib/auth/guards'
import GrowthClient from './GrowthClient'

export const dynamic = 'force-dynamic'

export default async function MasterGrowthPage() {
  await requireMasterAdmin()

  return <GrowthClient />
}
