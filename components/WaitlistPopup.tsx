'use client'
import { useState, useEffect } from 'react'
import { FiX, FiMail, FiUser, FiPhone, FiCheckCircle, FiAlertCircle, FiShield, FiLock } from 'react-icons/fi'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebaseClient'
import toast from 'react-hot-toast'

export default function WaitlistPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [interest, setInterest] = useState<'buyer' | 'seller' | 'agent' | 'investor' | 'other'>('buyer')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed or submitted
    const dismissed = localStorage.getItem('waitlist_dismissed')
    const alreadySubmitted = localStorage.getItem('waitlist_submitted')
    
    if (dismissed || alreadySubmitted) return

    // Show popup after 15 seconds on first visit
    const timer = setTimeout(() => {
      setIsOpen(true)
    }, 15000)

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !dismissed && !alreadySubmitted) {
        setIsOpen(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)

    // Listen for manual trigger from CTA buttons
    const handleManualTrigger = () => {
      if (!alreadySubmitted) {
        setIsOpen(true)
      }
    }
    
    // Global trigger accessible from anywhere
    ;(window as any).openWaitlistPopup = handleManualTrigger

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
      delete (window as any).openWaitlistPopup
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name || !email) {
      toast.error('Please fill in required fields')
      return
    }

    setLoading(true)
    try {
      // Add to Firestore
      await addDoc(collection(db, 'waitlist'), {
        name,
        email,
        phone: phone || null,
        interest,
        source: 'popup',
        createdAt: Timestamp.now(),
        status: 'pending',
        notified: false
      })

      // Send notification to admin
      await fetch('/api/notifications/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, interest })
      })

      setSubmitted(true)
      localStorage.setItem('waitlist_submitted', 'true')
      toast.success('Welcome to the waitlist! Check your email for confirmation.')
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        setIsOpen(false)
      }, 3000)
    } catch (error) {
      console.error('Waitlist submission error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    // Show confirmation before closing
    if (!submitted) {
      const confirmClose = window.confirm(
        "Don't miss out on early access! 🚀\n\nAre you sure you want to skip joining the waitlist? You'll miss exclusive beta access and launch perks."
      )
      if (!confirmClose) return
    }
    setIsOpen(false)
    localStorage.setItem('waitlist_dismissed', 'true')
  }

  // Prevent closing by clicking outside
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget && !submitted) {
      // Just shake the modal instead of closing
      const modal = document.querySelector('[data-waitlist-modal]')
      if (modal) {
        modal.classList.add('animate-shake')
        setTimeout(() => modal.classList.remove('animate-shake'), 500)
      }
    } else if (submitted) {
      setIsOpen(false)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        data-waitlist-modal
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] overflow-y-auto relative animate-slide-up"
      >
        {/* Close Button - Only show after submission or with confirmation */}
        {!submitted && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10 group"
            aria-label="Close"
          >
            <FiX className="text-xl text-gray-400 group-hover:text-gray-700" />
          </button>
        )}
        {submitted && (
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            aria-label="Close"
          >
            <FiX className="text-xl text-gray-600" />
          </button>
        )}

        {/* Scarcity Counter - Only show before submission */}
        {!submitted && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-sm font-bold">Only 23 Spots Left!</span>
            </div>
          </div>
        )}

        {submitted ? (
          // Success State
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="text-5xl text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">You're on the List! 🎉</h2>
            <p className="text-lg text-gray-600 mb-4">
              Thanks for joining, <span className="font-semibold text-[#00A676]">{name}</span>!
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg text-left">
              <div className="flex items-start gap-3">
                <FiAlertCircle className="text-blue-600 text-xl mt-0.5" />
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-2">What's Next?</p>
                  <ul className="space-y-1 text-sm">
                    <li>✅ Check your email for confirmation</li>
                    <li>✅ You'll receive exclusive updates as we build</li>
                    <li>✅ Get early beta access when we launch</li>
                    <li>✅ Enjoy special perks as an early supporter</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Form State
          <>
            {/* Header with Enhanced Design */}
            <div className="relative bg-gradient-to-br from-[#004AAD] via-[#0066CC] to-[#00A676] p-10 text-white rounded-t-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10">
                <div className="inline-block mb-4">
                  <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30">
                    <span className="animate-pulse">🚀</span>
                    <span className="text-sm font-semibold">Limited Beta Access</span>
                  </div>
                </div>
                
                <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                  Join the VIVENTA<br/>Exclusive Waitlist
                </h2>
                <p className="text-xl opacity-95 max-w-xl">
                  Be among the first <span className="font-bold underline decoration-2">100 members</span> to experience the future of Dominican real estate
                </p>
              </div>
            </div>

            {/* Enhanced Benefits Section */}
            <div className="p-8 bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 border-b-2 border-gray-100">
              <h3 className="text-center text-2xl font-bold text-gray-800 mb-6">
                Why Join Now? 🎁
              </h3>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#004AAD] to-[#00A676] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white text-xl font-bold">🚀</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Priority Beta Access</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Be the first to test cutting-edge features before public launch</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white text-xl font-bold">💎</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Exclusive VIP Perks</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Free premium features, priority support, and special discounts</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white text-xl font-bold">📢</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Insider Updates</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Behind-the-scenes development news and product roadmap insights</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white text-xl font-bold">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-1">Shape the Future</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">Direct input on features - your feedback drives our development</p>
                  </div>
                </div>
              </div>
              
              {/* Social Proof */}
              <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-600">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-600 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-400 to-green-600 border-2 border-white"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 border-2 border-white"></div>
                </div>
                <span className="font-semibold text-gray-700">Join <span className="text-[#00A676]">200+</span> early supporters already on the list!</span>
              </div>
            </div>

            {/* Enhanced Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Secure Your VIP Spot</h3>
                <p className="text-gray-600">Join in just 30 seconds - No credit card required</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Juan Pérez"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-[#00A676] transition-all text-gray-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g., juan@ejemplo.com"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-[#00A676] transition-all text-gray-800 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Phone Number <span className="text-gray-400 font-normal">(Optional - for exclusive offers)</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g., +1 (809) 123-4567"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-[#00A676] transition-all text-gray-800 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  What brings you to VIVENTA?
                </label>
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value as any)}
                  className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A676] focus:border-[#00A676] transition-all text-gray-800 font-medium bg-white"
                >
                  <option value="buyer">🏠 I want to buy a property</option>
                  <option value="seller">💰 I want to sell a property</option>
                  <option value="agent">🤝 I'm a real estate professional</option>
                  <option value="investor">📈 I'm interested in investing</option>
                  <option value="other">👀 Just exploring options</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#004AAD] via-[#0066CC] to-[#00A676] text-white py-5 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Securing Your Spot...
                      </>
                    ) : (
                      <>
                        🎉 Reserve My VIP Spot Now!
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00A676] to-[#004AAD] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </div>

              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl">
                <FiCheckCircle className="text-green-600 flex-shrink-0 text-xl" />
                <p className="text-xs text-gray-700 leading-relaxed">
                  <span className="font-semibold">100% Free.</span> No spam, no credit card required. Unsubscribe anytime. We respect your privacy.
                </p>
              </div>

              <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
                <div className="flex items-center gap-1">
                  <FiShield className="text-gray-400" />
                  <span>Secure & Encrypted</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-1">
                  <FiLock className="text-gray-400" />
                  <span>GDPR Compliant</span>
                </div>
              </div>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
