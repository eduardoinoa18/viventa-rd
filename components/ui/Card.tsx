import React from 'react'
import clsx from 'clsx'

export type CardProps = {
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  className?: string
  children?: React.ReactNode
}

export default function Card({ title, description, actions, className, children }: CardProps) {
  return (
    <section className={clsx('bg-white border border-gray-100 rounded-xl shadow-sm p-6', className)}>
      {(title || description || actions) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {title && <h2 className="text-xl font-semibold text-viventa-navy">{title}</h2>}
            {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}
