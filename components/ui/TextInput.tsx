import React from 'react'
import clsx from 'clsx'

export type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}

const base = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-viventa.teal focus:border-transparent placeholder:text-gray-400'

export default function TextInput({ className, invalid, ...props }: TextInputProps) {
  return (
    <input
      className={clsx(base, invalid ? 'border-red-300' : 'border-gray-300', className)}
      {...props}
    />
  )
}
