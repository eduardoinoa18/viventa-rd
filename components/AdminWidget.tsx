// components/AdminWidget.tsx
import { ReactNode } from 'react'

export default function AdminWidget({ 
  title, 
  value, 
  subtitle, 
  icon 
}: { 
  title: string; 
  value: string | number; 
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        {icon && <span className="text-2xl text-[#0B2545]">{icon}</span>}
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-2">{subtitle}</div>}
    </div>
  )
}
