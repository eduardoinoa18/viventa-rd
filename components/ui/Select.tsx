import React from 'react'
import clsx from 'clsx'

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean
}

const base = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-viventa.teal focus:border-transparent'

export default function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select className={clsx(base, invalid ? 'border-red-300' : 'border-gray-300', className)} {...props}>
      {children}
    </select>
  )
}
