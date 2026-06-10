import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { Link, useLocation } from '@tanstack/react-router'
import { clsx } from 'clsx'

interface TabDropdownOption {
  name: string
  to: string
}

interface TabDropdownProps {
  label: string
  options: TabDropdownOption[]
  active?: boolean
}

export const TabDropdown = ({ label, options, active }: TabDropdownProps) => {
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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 text-[12px] font-medium rounded-lg transition-all duration-200 min-w-[170px] justify-between',
          active
            ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20'
            : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50 shadow-sm'
        )}
      >
        <span>{label}</span>
        <ChevronDown className={clsx('h-4 w-4 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-full bg-white border border-blue-200 rounded-lg shadow-[0_15px_50px_rgba(0,0,0,0.1)] z-[100] overflow-hidden animate-slide-down">
          {options.map((option, index) => (
            <Link
              key={option.to}
              to={option.to as any}
              onClick={() => setIsOpen(false)}
              className={clsx(
                'block px-4 py-2 text-[12px] font-medium transition-colors whitespace-nowrap overflow-hidden text-ellipsis h-full flex items-center',
                index !== options.length - 1 && 'border-b border-blue-50',
                location.pathname === option.to
                  ? 'bg-blue-100 text-[#1e4ba1]'
                  : 'text-gray-500 hover:bg-blue-50 hover:text-[#1e4ba1]'
              )}
            >
              {option.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
