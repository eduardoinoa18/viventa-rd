// components/WhatsAppFloatingCTA.tsx
'use client';

import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { FiPhone, FiMail, FiX } from 'react-icons/fi';
import Image from 'next/image';

interface Agent {
  id?: string;
  name: string;
  phone: string;
  photo?: string;
  email?: string;
  verificationTier?: 'verified' | 'pro' | 'elite';
  avgResponseTime?: number; // minutes
}

interface Listing {
  id: string;
  title?: string;
  displayTitle?: string;
  address: string;
  price: number;
  currency?: 'USD' | 'DOP';
}

interface WhatsAppFloatingCTAProps {
  agent: Agent;
  listing: Listing;
  className?: string;
}

export default function WhatsAppFloatingCTA({ 
  agent, 
  listing, 
  className = '' 
}: WhatsAppFloatingCTAProps) {
  const [showCard, setShowCard] = useState(false);
  
  const message = generateWhatsAppMessage(listing, agent.name);
  const whatsappUrl = `https://wa.me/${agent.phone.replace(/\D/g, '')}?text=${message}`;
  
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Get verification badge info
  const getVerificationBadge = () => {
    if (!agent.verificationTier) return null;
    
    const badges = {
      verified: { label: '✓ Verificado', color: 'bg-green-50 text-green-700' },
      pro: { label: '✓ Pro', color: 'bg-blue-50 text-blue-700' },
      elite: { label: '✓ Elite', color: 'bg-purple-50 text-purple-700' }
    };
    
    return badges[agent.verificationTier];
  };
  
  const badge = getVerificationBadge();
  
  // Mobile floating button
  const MobileButton = () => (
    <div className={`lg:hidden fixed bottom-20 right-4 z-50 ${className}`}>
      {!showCard ? (
        <button
          onClick={() => setShowCard(true)}
          className="w-16 h-16 bg-[#25D366] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform animate-pulse"
          aria-label="Contactar por WhatsApp"
        >
          <FaWhatsapp className="text-white text-3xl" />
        </button>
      ) : (
        <div className="bg-white rounded-2xl shadow-2xl p-4 w-72 relative animate-slide-up">
          <button
            onClick={() => setShowCard(false)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition"
            aria-label="Cerrar"
          >
            <FiX />
          </button>
          
          <div className="text-center mb-4 mt-2">
            {agent.photo ? (
              <Image
                src={agent.photo}
                alt={agent.name}
                width={60}
                height={60}
                className="rounded-full mx-auto mb-2 border-2 border-[#00A6A6]"
              />
            ) : (
              <div className="w-15 h-15 bg-gradient-to-br from-[#00A6A6] to-[#00C8C8] rounded-full mx-auto mb-2 flex items-center justify-center text-white text-2xl font-bold">
                {agent.name.charAt(0)}
              </div>
            )}
            <h4 className="font-bold text-[#0B2545] mb-1">{agent.name}</h4>
            {badge && (
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.label}
              </span>
            )}
            {agent.avgResponseTime && agent.avgResponseTime < 120 && (
              <p className="text-xs text-gray-600 mt-1">
                🟢 Responde en menos de 2 horas
              </p>
            )}
          </div>
          
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#20BA5A] transition text-center mb-2 flex items-center justify-center gap-2 shadow-md"
          >
            <FaWhatsapp className="text-xl" />
            Enviar WhatsApp
          </a>
          
          <a
            href={`tel:${agent.phone}`}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-center flex items-center justify-center gap-2"
          >
            <FiPhone />
            Llamar
          </a>
        </div>
      )}
    </div>
  );
  
  // Desktop sticky sidebar
  const DesktopSidebar = () => (
    <div className={`hidden lg:block sticky top-24 ${className}`}>
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="text-center mb-4">
          {agent.photo ? (
            <Image
              src={agent.photo}
              alt={agent.name}
              width={80}
              height={80}
              className="rounded-full mx-auto mb-3 border-2 border-[#00A6A6]"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-[#00A6A6] to-[#00C8C8] rounded-full mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold">
              {agent.name.charAt(0)}
            </div>
          )}
          <h4 className="font-bold text-lg text-[#0B2545]">{agent.name}</h4>
          {badge && (
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${badge.color}`}>
              {badge.label}
            </span>
          )}
          {agent.avgResponseTime && agent.avgResponseTime < 120 && (
            <p className="text-sm text-gray-600 mt-2 flex items-center justify-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Responde en menos de 2 horas
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-gradient-to-r from-[#25D366] to-[#20BA5A] text-white rounded-lg font-medium hover:shadow-lg transition text-center flex items-center justify-center gap-2"
          >
            <FaWhatsapp className="text-xl" />
            Contactar por WhatsApp
          </a>
          
          <a
            href={`tel:${agent.phone}`}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-center flex items-center justify-center gap-2"
          >
            <FiPhone />
            Llamar ahora
          </a>
          
          {agent.email && (
            <a
              href={`mailto:${agent.email}`}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition text-center flex items-center justify-center gap-2"
            >
              <FiMail />
              Enviar email
            </a>
          )}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-1">📍 {listing.address}</p>
          <p className="text-sm font-semibold text-[#0B2545]">
            {formatPrice(listing.price, listing.currency || 'USD')}
          </p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Horario de atención: Lun-Vie 9am-6pm
          </p>
        </div>
      </div>
    </div>
  );
  
  return (
    <>
      <MobileButton />
      <DesktopSidebar />
    </>
  );
}

function generateWhatsAppMessage(listing: Listing, agentName: string): string {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  const propertyTitle = listing.title || listing.displayTitle || 'Propiedad en VIVENTA';
  
  const message = `Hola ${agentName}, me interesa esta propiedad en VIVENTA:

📍 ${propertyTitle}
${listing.address}

💰 Precio: ${formatPrice(listing.price, listing.currency || 'USD')}

🔗 https://viventa.com.do/listing/${listing.id}

¿Está disponible para una visita?`;

  return encodeURIComponent(message);
}
