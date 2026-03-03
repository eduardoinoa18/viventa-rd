import { requireMasterAdmin } from '@/lib/auth/guards'
import DataQualityClient from './DataQualityClient'

export const dynamic = 'force-dynamic'

export default async function MasterDataQualityPage() {
  await requireMasterAdmin()

  return <DataQualityClient />
}
