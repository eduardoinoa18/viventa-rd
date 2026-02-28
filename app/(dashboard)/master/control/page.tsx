import { requireMasterAdmin } from '@/lib/auth/guards'
import ControlCenterClient from './ControlCenterClient'

export default async function MasterControlPage() {
  await requireMasterAdmin()
  return <ControlCenterClient />
}
