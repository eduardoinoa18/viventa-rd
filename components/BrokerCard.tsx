import Link from 'next/link'
import { FiStar, FiPhone, FiMail, FiUsers, FiHome, FiTrendingUp, FiMapPin, FiAward } from 'react-icons/fi'

export default function BrokerCard({ broker }: { broker: any }) {
  const teamSize = broker.teamSize || broker.agents || 0
  const activeListings = broker.activeListings || 0
  const brokerCode = broker.brokerCode || ''
  const languages = broker.languages || 'Español'
  const yearsExp = broker.yearsExperience || broker.years || 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header with Gradient */}
      <div className="relative bg-gradient-to-br from-[#3BAFDA] to-[#0B2545] p-6 pb-14">
        {brokerCode && (
          <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-bold shadow">
            {brokerCode}
          </div>
        )}
        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
          <FiAward size={12} /> Brokerage
        </div>
      </div>

      {/* Company Logo */}
      <div className="relative -mt-10 flex justify-center">
        <div className="relative">
          <img 
            src={broker.photo || broker.companyLogo || '/brokerage-placeholder.jpg'} 
            alt={broker.name || broker.company} 
            className="w-20 h-20 rounded-lg object-cover border-4 border-white shadow-lg bg-white"
            onError={(e) => {
              e.currentTarget.src = '/brokerage-placeholder.jpg'
            }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-bold text-xl text-[#0B2545] mb-1 text-center">
          {broker.name || broker.company}
        </h3>
        
        {/* Location */}
        {broker.area && (
          <div className="text-sm text-gray-600 flex items-center justify-center gap-1 mb-3">
            <FiMapPin className="text-[#3BAFDA]" />
            {broker.area}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center justify-center gap-1 mb-4">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(broker.rating || 4.7)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {(broker.rating || 4.7).toFixed(1)}
          </span>
        </div>

        {/* Key Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center">
            <FiUsers className="mx-auto text-[#3BAFDA] mb-1" size={20} />
            <div className="text-lg font-bold text-[#0B2545]">{teamSize}</div>
            <div className="text-xs text-gray-600">Agentes</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center">
            <FiHome className="mx-auto text-[#00A676] mb-1" size={20} />
            <div className="text-lg font-bold text-[#0B2545]">{activeListings}+</div>
            <div className="text-xs text-gray-600">Listados</div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center">
            <FiTrendingUp className="mx-auto text-purple-600 mb-1" size={20} />
            <div className="text-lg font-bold text-[#0B2545]">{yearsExp}+</div>
            <div className="text-xs text-gray-600">Años</div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mb-4 space-y-2 text-sm">
          {languages && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-semibold text-[#0B2545]">Idiomas:</span>
              {languages}
            </div>
          )}
          {broker.markets && (
            <div className="flex items-center gap-2 text-gray-600">
              <span className="font-semibold text-[#0B2545]">Mercados:</span>
              <span className="truncate">{broker.markets}</span>
            </div>
          )}
        </div>

        {/* CRM/Tools */}
        {broker.crm && (
          <div className="mb-4 flex flex-wrap gap-1 justify-center">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {broker.crm} CRM
            </span>
            {broker.insurance && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Asegurado
              </span>
            )}
          </div>
        )}

        {/* Contact Actions */}
        <div className="flex gap-2 mb-3">
          {broker.phone && (
            <a
              href={`tel:${broker.phone}`}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#0B2545] text-white rounded-lg hover:bg-[#134074] transition text-sm font-medium"
            >
              <FiPhone size={14} /> Llamar
            </a>
          )}
          {broker.email && (
            <a
              href={`mailto:${broker.email}`}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#3BAFDA] text-white rounded-lg hover:bg-[#2A9FC7] transition text-sm font-medium"
            >
              <FiMail size={14} /> Email
            </a>
          )}
        </div>

        {/* View Profile Link */}
        <Link
          href={`/brokers/${broker.id}`}
          className="block w-full py-2 text-[#3BAFDA] font-semibold hover:text-[#2A9FC7] transition text-sm text-center"
        >
          Ver Perfil Completo →
        </Link>
      </div>

      {/* Hover Effect Border */}
      <div className="h-1 bg-gradient-to-r from-[#3BAFDA] via-[#00A676] to-[#0B2545] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </div>
  )
}
