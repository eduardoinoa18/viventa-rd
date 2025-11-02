'use client'
import { FaWhatsapp } from 'react-icons/fa'

interface WhatsAppButtonProps {
  phoneNumber: string
  propertyTitle?: string
  propertyId?: string
  propertyPrice?: string
  className?: string
  agentName?: string
}

export default function WhatsAppButton({
  phoneNumber,
  propertyTitle,
  propertyId,
  propertyPrice,
  className = '',
  agentName = 'el agente'
}: WhatsAppButtonProps) {
  
  function handleWhatsAppClick() {
    // Format phone number (remove spaces, dashes, add country code if needed)
    let formattedPhone = phoneNumber.replace(/[\s-]/g, '')
    
    // Add Dominican Republic country code if not present
    if (!formattedPhone.startsWith('+') && !formattedPhone.startsWith('1')) {
      formattedPhone = '1' + formattedPhone
    }
    
    // Pre-filled message template
    let message = `Hola ${agentName}, estoy interesado en `
    
    if (propertyTitle) {
      message += `la propiedad "${propertyTitle}"`
    } else {
      message += 'una de las propiedades publicadas'
    }
    
    if (propertyPrice) {
      message += ` con precio de ${propertyPrice}`
    }
    
    if (propertyId) {
      message += `. Ref: ${propertyId}`
    }
    
    message += '. ¿Podría darme más información?'
    
    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`
    
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
