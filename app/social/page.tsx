import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BottomNav from '../../components/BottomNav'
import SocialFeed from '@/components/SocialFeed'
import SocialComingSoon from '@/components/SocialComingSoon'
import { cookies } from 'next/headers'

export default function SocialPage() {
  const socialEnabled =
    process.env.FEATURE_SOCIAL_ENABLED === 'true' ||
    process.env.NEXT_PUBLIC_FEATURE_SOCIAL_ENABLED === 'true'

  // Only Master Admins can access the Social feed during rollout; everyone else sees Coming Soon
  const c = cookies()
  const role = c.get('viventa_role')?.value
  const isMasterAdmin = role === 'master' || role === 'admin-master' || role === 'master-admin'
  const allowFeed = socialEnabled && isMasterAdmin

  const wrapperClass = allowFeed
    ? 'min-h-screen flex flex-col'
    : 'min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col'

  return (
    <div className={wrapperClass}>
      <Header />
      {allowFeed ? <SocialFeed /> : <SocialComingSoon />}
      <Footer />
      <BottomNav />
    </div>
  )
}
