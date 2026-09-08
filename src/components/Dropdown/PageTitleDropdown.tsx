import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { clsx } from 'clsx'
import { usePermissions } from '@/hooks/usePermissions'

export interface PageTitleDropdownOption {
  name: string
  to: string
  permission?: string | string[]
}

export interface PageTitleDropdownProps {
  title: string
  options: PageTitleDropdownOption[]
}

export const PageTitleDropdown = ({ title, options }: PageTitleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { hasPermission, hasAnyPermission } = usePermissions()

  const visibleOptions = useMemo(() => {
    return options.filter((option) => {
      if (!option.permission) return true
      if (Array.isArray(option.permission)) {
        return hasAnyPermission(option.permission)
      }
      return hasPermission(option.permission)
    })
  }, [options, hasPermission, hasAnyPermission])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (visibleOptions.length <= 1) {
    return (
      <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
        {title}
      </h1>
    )
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 group px-1 rounded-lg transition-all duration-200"
      >
        <h1 className="text-[20px] font-medium text-primary tracking-tight ml-2">
          {title}
        </h1>
        <div className={clsx(
          "p-0.5 rounded-full bg-blue-50 text-[#1e4ba1] transition-transform duration-300",
          isOpen ? "rotate-180" : "group-hover:scale-110"
        )}>
          <ChevronDown className="h-4 w-4" strokeWidth={3} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 min-w-[220px] max-h-[400px] overflow-y-auto custom-scrollbar bg-white border border-blue-200 rounded-lg shadow-[0_15px_50px_rgba(0,0,0,0.1)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          {visibleOptions.map((option, index) => {
            const toStr = typeof option.to === 'string' ? option.to : ''
            const isActive = toStr.includes('?')
              ? (window.location.pathname + window.location.search) === toStr
              : window.location.pathname === toStr
            return (
              <Link
                key={option.to}
                to={option.to as any}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'block px-4 py-2 text-[12px] font-medium transition-colors whitespace-nowrap overflow-hidden text-ellipsis flex items-center',
                  index !== visibleOptions.length - 1 && 'border-b border-blue-50',
                  isActive
                    ? 'bg-blue-100 text-[#1e4ba1]'
                    : 'text-gray-500 hover:bg-blue-50 hover:text-[#1e4ba1]'
                )}
              >
                {option.name}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
