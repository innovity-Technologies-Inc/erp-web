import React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'warning'
  loading?: boolean
}

export const Button = ({
  children,
  className,
  variant = 'primary',
  loading,
  disabled,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: 'bg-[#059669] text-white hover:bg-[#047857] shadow-md shadow-emerald-500/20 disabled:bg-gray-400 disabled:shadow-none',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:bg-gray-100',
    outline: 'bg-white text-[#64748b] border border-gray-200 hover:bg-gray-50 shadow-sm disabled:opacity-50',
    ghost: 'text-gray-600 hover:bg-gray-100 disabled:bg-transparent',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-md shadow-rose-500/20 disabled:bg-gray-400 disabled:shadow-none',
    warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/20 disabled:bg-gray-400 disabled:shadow-none',
  }

  return (
    <button
      className={cn(
        'px-8 h-10 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed text-[13px]',
        variants[variant],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  )
}
