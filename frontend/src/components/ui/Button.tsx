import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>

export function Button({ children, className = '', ...rest }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md bg-gradient-to-r from-brand-600 to-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:from-brand-700 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-slate-950 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}

