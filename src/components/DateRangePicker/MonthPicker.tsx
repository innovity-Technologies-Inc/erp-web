import { useState, useRef, useEffect } from 'react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  setMonth,
  subYears,
  addYears
} from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

interface MonthPickerProps {
  from?: string
  onChange?: (from: string, to: string) => void
  disabled?: boolean
  className?: string
  variant?: 'default' | 'compact'
}

export const MonthPicker = ({ from, onChange, disabled, className, variant = 'default' }: MonthPickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(from ? new Date(from) : new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const currentDate = from ? new Date(from) : new Date()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const handleMonthClick = (monthIdx: number) => {
    const selectedDate = setMonth(viewDate, monthIdx)
    const start = format(startOfMonth(selectedDate), 'yyyy-MM-dd')
    const end = format(endOfMonth(selectedDate), 'yyyy-MM-dd')
    onChange?.(start, end)
    setIsOpen(false)
  }

  const handleYearChange = (delta: number) => {
    setViewDate(prev => delta > 0 ? addYears(prev, 1) : subYears(prev, 1))
  }

  return (
    <div className={clsx("relative inline-block", className)} ref={containerRef}>
      <button 
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "bg-[#f8fafc] border border-gray-100 px-4 rounded-full h-8 flex items-center gap-2 text-[12px] font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:border-gray-200 transition-all shadow-inner",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          isOpen && "border-primary/20 bg-white ring-4 ring-primary/5 text-primary"
        )}
      >
        <CalendarIcon className="w-3 h-3 text-primary opacity-60" />
        <span className="truncate">
          {disabled ? "Custom Filter" : (from ? format(currentDate, variant === 'compact' ? 'MMM yyyy' : 'MMMM yyyy') : "Select Month")}
        </span>
        <ChevronDown className={clsx("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute right-0 top-full mt-2 z-[110] bg-white border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] p-4 animate-in fade-in slide-in-from-top-2 duration-200 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 px-1">
             <button 
               onClick={() => handleYearChange(-1)}
               className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors"
             >
               <ChevronLeft className="h-4 w-4" />
             </button>
             
             <span className="text-[14px] font-bold text-[#1e293b]">
               {format(viewDate, 'yyyy')}
             </span>

             <button 
               onClick={() => handleYearChange(1)}
               className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-primary transition-colors"
             >
               <ChevronRight className="h-4 w-4" />
             </button>
          </div>

          {/* Month Grid */}
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, idx) => {
              const isSelected = !!from && currentDate.getMonth() === idx && currentDate.getFullYear() === viewDate.getFullYear()
              return (
                <button
                  key={month}
                  onClick={() => handleMonthClick(idx)}
                  className={clsx(
                    "py-2.5 rounded-xl text-[12px] font-medium transition-all",
                    isSelected 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-105" 
                      : "hover:bg-primary/5 text-[#64748b] hover:text-primary"
                  )}
                >
                  {month}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
