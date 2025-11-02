import Link from 'next/link'
import { FiStar, FiPhone, FiMail, FiAward, FiBriefcase, FiMapPin } from 'react-icons/fi'

export default function AgentCard({ agent }: { agent: any }) {
  const yearsExp = agent.yearsExperience || agent.years || 0
  const specialties = agent.specialties || agent.specialty || ''
  const languages = agent.languages || 'Español'
  const agentCode = agent.agentCode || ''

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header with Code Badge */}
      <div className="relative bg-gradient-to-br from-[#0B2545] to-[#134074] p-4 pb-12">
        {agentCode && (
          <div className="absolute top-3 right-3 bg-[#00A676] text-white px-2 py-1 rounded-full text-xs font-bold shadow">
            {agentCode}
          </div>
        )}
      </div>

      {/* Profile Image */}
      <div className="relative -mt-8 flex justify-center">
        <div className="relative">
          <img 
            src={agent.photo || agent.profileImage || '/agent-placeholder.jpg'} 
            alt={agent.name} 
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            onError={(e) => {
              e.currentTarget.src = '/agent-placeholder.jpg'
            }}
          />
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white"></div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 text-center">
        <h3 className="font-bold text-lg text-[#0B2545] mb-1">{agent.name}</h3>
        
        {/* Location */}
        <div className="text-sm text-gray-600 flex items-center justify-center gap-1 mb-2">
          <FiMapPin className="text-[#00A676]" />
          {agent.area || 'República Dominicana'}
        </div>

        {/* Rating */}
        <div className="flex items-center justify-center gap-1 mb-3">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(agent.rating || 4.5)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {(agent.rating || 4.5).toFixed(1)}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-500">Experiencia</div>
            <div className="font-bold text-[#0B2545]">{yearsExp || 'N/A'} años</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <div className="text-gray-500">Idiomas</div>
            <div className="font-bold text-[#0B2545] truncate">{languages}</div>
          </div>
        </div>

        {/* Specialties */}
        {specialties && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1 justify-center">
              {specialties.split(',').slice(0, 2).map((spec: string, idx: number) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-[#00A676]/10 text-[#00A676] rounded-full text-xs font-medium"
                >
                  {spec.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Actions */}
        <div className="flex gap-2 mb-3">
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#0B2545] text-white rounded-lg hover:bg-[#134074] transition text-sm font-medium"
            >
              <FiPhone size={14} /> Llamar
            </a>
          )}
          {agent.email && (
            <a
              href={`mailto:${agent.email}`}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#00A676] text-white rounded-lg hover:bg-[#008c8c] transition text-sm font-medium"
            >
              <FiMail size={14} /> Email
            </a>
          )}
        </div>

        {/* View Profile Link */}
        <Link
          href={`/agents/${agent.id}`}
          className="block w-full py-2 text-[#3BAFDA] font-semibold hover:text-[#2A9FC7] transition text-sm"
        >
          Ver Perfil Completo →
        </Link>
      </div>

      {/* Hover Effect Border */}
      <div className="h-1 bg-gradient-to-r from-[#0B2545] via-[#00A676] to-[#3BAFDA] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
    </div>
  )
}
