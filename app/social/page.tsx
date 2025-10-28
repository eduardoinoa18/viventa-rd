import Header from '../../components/Header'
import Footer from '../../components/Footer'
import BottomNav from '../../components/BottomNav'
import SocialFeed from '@/components/SocialFeed'
import SocialComingSoon from '@/components/SocialComingSoon'

export default function SocialPage() {
  const socialEnabled =
    process.env.FEATURE_SOCIAL_ENABLED === 'true' ||
    process.env.NEXT_PUBLIC_FEATURE_SOCIAL_ENABLED === 'true'

  const wrapperClass = socialEnabled
    ? 'min-h-screen flex flex-col'
    : 'min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 flex flex-col'

  return (
    <div className={wrapperClass}>
      <Header />
      {socialEnabled ? <SocialFeed /> : <SocialComingSoon />}
      <Footer />
      <BottomNav />
    </div>
  )
}
