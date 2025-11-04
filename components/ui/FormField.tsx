import React from 'react'
import clsx from 'clsx'

export type FormFieldProps = {
  id: string
  label: React.ReactNode
  hint?: React.ReactNode
  required?: boolean
  className?: string
  children: React.ReactNode
}

export default function FormField({ id, label, hint, required, className, children }: FormFieldProps) {
  return (
    <div className={clsx('space-y-1.5', className)}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  )
}
