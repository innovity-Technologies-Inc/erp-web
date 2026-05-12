import React from 'react'
import { clsx } from 'clsx'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
  labelClassName?: string
}

export const FormField = ({ label, error, required, children, labelClassName }: FormFieldProps) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={clsx("text-sm font-semibold text-gray-700 uppercase tracking-wider", labelClassName)}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
    </div>
  )
}
