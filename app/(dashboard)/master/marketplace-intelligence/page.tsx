import { requireMasterAdmin } from '@/lib/auth/guards'
import MarketplaceIntelligenceClient from './MarketplaceIntelligenceClient'

export const dynamic = 'force-dynamic'

export default async function MasterMarketplaceIntelligencePage() {
  await requireMasterAdmin()

  return <MarketplaceIntelligenceClient />
}
