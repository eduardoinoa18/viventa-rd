import Link from 'next/link'
import { FiStar, FiPhone, FiMail } from 'react-icons/fi'

export default function AgentCard({ agent }: { agent: any }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center text-center hover:shadow-lg transition">
      <img src={agent.photo || '/default-agent.jpg'} alt={agent.name} className="w-20 h-20 rounded-full object-cover mb-2" />
      <div className="font-bold text-[#0B2545]">{agent.name}</div>
      <div className="text-xs text-gray-600 mb-1">{agent.area}</div>
      <div className="text-xs text-yellow-500 inline-flex items-center gap-1">
        <FiStar /> {agent.rating || '5.0'}
      </div>
      <Link href={`/agents/${agent.id}`} className="mt-2 text-[#3BAFDA] font-semibold hover:underline">Ver perfil</Link>
      {agent.email || agent.phone ? (
        <div className="mt-2 flex items-center gap-3 text-sm">
          {agent.phone && <a href={`tel:${agent.phone}`} className="text-[#0B2545] hover:text-[#00A6A6] inline-flex items-center gap-1"><FiPhone /> Llamar</a>}
          {agent.email && <a href={`mailto:${agent.email}`} className="text-[#0B2545] hover:text-[#00A6A6] inline-flex items-center gap-1"><FiMail /> Email</a>}
        </div>
      ) : null}
    </div>
  )
}
