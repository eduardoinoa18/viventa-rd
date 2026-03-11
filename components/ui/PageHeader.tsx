// components/ui/PageHeader.tsx
// Standard page header used at the top of every dashboard page.
//
// Usage:
//   <PageHeader
//     title="Deals"
//     description="Track and manage transaction progress"
//     actions={[{ label: '+ New Deal', href: '/dashboard/broker/deals/new' }]}
//   />

import Link from 'next/link'

export type PageHeaderAction = {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

type PageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
  actions?: PageHeaderAction[]
  children?: React.ReactNode
}

export default function PageHeader({ title, description, eyebrow, actions = [], children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-widest text-[#00A676]">{eyebrow}</p>
        )}
        <h1 className="truncate text-xl font-bold text-[#0B2545] sm:text-2xl">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-gray-500">{description}</p>
        )}
      </div>

      {(actions.length > 0 || children) && (
        <div className="mt-3 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0">
          {children}
          {actions.map((action, i) => {
            const base =
              action.variant === 'secondary'
                ? 'inline-flex items-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50'
                : 'inline-flex items-center rounded-lg bg-gradient-to-r from-[#00A676] to-[#008F64] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-[#008F64] hover:to-[#007A55]'
            if (action.href) {
              return (
                <Link key={i} href={action.href} className={base}>
                  {action.label}
                </Link>
              )
            }
            return (
              <button key={i} type="button" onClick={action.onClick} className={base}>
                {action.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
