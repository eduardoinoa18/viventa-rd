'use client'
import { FaWhatsapp } from 'react-icons/fa'
import { trackWhatsAppClick, getCurrentUserInfo } from '@/lib/analyticsService'
import { VIVENTA_PHONE_E164, buildPropertyWhatsAppMessage } from '@/lib/contact'

interface WhatsAppButtonProps {
  /** Ignored — all contacts are routed through VIVENTA's central number. */
  phoneNumber?: string
  propertyTitle?: string
  propertyId?: string
  propertyPrice?: string
  className?: string
  agentName?: string
  agentId?: string
}

// phoneNumber is kept for API compatibility but all traffic is routed to VIVENTA central
export default function WhatsAppButton({
  phoneNumber: _phoneNumber,
  propertyTitle,
  propertyId,
  propertyPrice: _propertyPrice,
  className = '',
  agentName: _agentName = 'el agente',
  agentId
}: WhatsAppButtonProps) {
  
  function handleWhatsAppClick() {
    // Track WhatsApp click
    const { userId, userRole } = getCurrentUserInfo()
    trackWhatsAppClick(propertyId, agentId, userId, userRole)
    // Format phone number (remove spaces, dashes, add country code if needed)
    // Always route to VIVENTA central number — leads are captured first
    const formattedPhone = VIVENTA_PHONE_E164
    
    
    const message = buildPropertyWhatsAppMessage(propertyTitle, propertyId)
    
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`
    
    // Track analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'whatsapp_contact', {
        property_id: propertyId,
        agent_phone: formattedPhone
      })
    }
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <button
      onClick={handleWhatsAppClick}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold rounded-lg transition-colors shadow-md ${className}`}
    >
      <FaWhatsapp className="text-xl" />
      <span>Contactar por WhatsApp</span>
    </button>
  )
}
