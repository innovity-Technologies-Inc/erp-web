import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { clsx } from 'clsx'

interface PageTitleDropdownOption {
  name: string
  to: string
}

interface PageTitleDropdownProps {
  title: string
  options: PageTitleDropdownOption[]
}

export const PageTitleDropdown = ({ title, options }: PageTitleDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        <div className="absolute left-0 mt-2 min-w-[220px] bg-white border border-blue-200 rounded-lg shadow-[0_15px_50px_rgba(0,0,0,0.1)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {options.map((option, index) => {
            const isActive = location.pathname === option.to
            return (
              <Link
                key={option.to}
                to={option.to as any}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'block px-4 py-2 text-[12px] font-medium transition-colors whitespace-nowrap overflow-hidden text-ellipsis flex items-center',
                  index !== options.length - 1 && 'border-b border-blue-50',
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
