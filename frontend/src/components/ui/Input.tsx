import type { InputHTMLAttributes } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export function Input({ className = '', ...props }: Props) {
  return (
    <input
      className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-brand-500 ${className}`}
      {...props}
    />
  )
}

