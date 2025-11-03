'use client'
import { useState, useEffect } from 'react'
import { FiX, FiMail, FiUser, FiPhone, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
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
    setIsOpen(false)
    localStorage.setItem('waitlist_dismissed', 'true')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative animate-slide-up">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label="Close"
        >
          <FiX className="text-xl text-gray-600" />
        </button>

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
            {/* Header */}
            <div className="bg-gradient-to-r from-[#004AAD] to-[#00A676] p-8 text-white rounded-t-2xl">
              <h2 className="text-3xl font-bold mb-3">Join the VIVENTA Waitlist</h2>
              <p className="text-lg opacity-90">
                Be among the first to experience the future of Dominican real estate
              </p>
            </div>

            {/* Benefits */}
            <div className="p-6 bg-blue-50 border-b">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#00A676] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Early Beta Access</h3>
                    <p className="text-sm text-gray-600">Test features before anyone else</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#00A676] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Exclusive Updates</h3>
                    <p className="text-sm text-gray-600">Insider news on our progress</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#00A676] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Special Launch Perks</h3>
                    <p className="text-sm text-gray-600">Premium features at no cost</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-[#00A676] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Shape the Product</h3>
                    <p className="text-sm text-gray-600">Your feedback matters</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Pérez"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="juan@ejemplo.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone (Optional)
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (809) 123-4567"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  I'm interested in...
                </label>
                <select
                  value={interest}
                  onChange={(e) => setInterest(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A676] focus:border-transparent"
                >
                  <option value="buyer">Buying a property</option>
                  <option value="seller">Selling a property</option>
                  <option value="agent">Becoming an agent</option>
                  <option value="investor">Investing in real estate</option>
                  <option value="other">Just exploring</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#004AAD] to-[#00A676] text-white py-4 rounded-lg font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Reserve My Spot 🚀'}
              </button>

              <p className="text-xs text-center text-gray-500">
                By joining, you agree to receive updates about VIVENTA. We respect your privacy and won't spam you.
              </p>
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
