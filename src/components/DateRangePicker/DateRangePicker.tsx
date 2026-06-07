import { useState, useRef, useEffect, useMemo } from 'react'
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval, 
  isWithinInterval, 
  isBefore,
  parseISO,
  isValid
} from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { clsx } from 'clsx'
import { Select2 } from '@/components/Select/Select2'

interface DateRangePickerProps {
  from?: string
  to?: string
  onChange?: (from: string, to: string) => void
}

export const DateRangePicker = ({ from, to, onChange }: DateRangePickerProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())
  const containerRef = useRef<HTMLDivElement>(null)

  const startDate = useMemo(() => from && isValid(parseISO(from)) ? parseISO(from) : null, [from])
  const endDate = useMemo(() => to && isValid(parseISO(to)) ? parseISO(to) : null, [to])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleDateClick = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      onChange?.(format(date, 'yyyy-MM-dd'), '')
    } else {
      if (isBefore(date, startDate)) {
        onChange?.(format(date, 'yyyy-MM-dd'), '')
      } else {
        onChange?.(format(startDate, 'yyyy-MM-dd'), format(date, 'yyyy-MM-dd'))
        setIsOpen(false)
      }
    }
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.('', '')
    setIsOpen(false)
  }

  const renderMonth = (monthDate: Date) => {
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthStart)
    const startDateView = startOfWeek(monthStart)
    const endDateView = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
      start: startDateView,
      end: endDateView
    })

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: 101 }, (_, i) => currentYear - 70 + i)
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    return (
      <div className="w-50">
        <div className="flex items-center justify-center mb-4 z-50">
          <Select2
            options={months.map((month, idx) => ({ value: idx, label: month }))}
            value={monthDate.getMonth()}
            onChange={(val) => {
              const newDate = new Date(monthDate)
              newDate.setMonth(Number(val))
              setViewDate(newDate)
            }}
            variant="ghost"
            className="min-w-[100px]"
            menuPortalTarget={document.body}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          />
          <Select2
            options={years.map(year => ({ value: year, label: String(year) }))}
            value={monthDate.getFullYear()}
            onChange={(val) => {
              const newDate = new Date(monthDate)
              newDate.setFullYear(Number(val))
              setViewDate(newDate)
            }}
            variant="ghost"
            className="min-w-[80px]"
            menuPortalTarget={document.body}
            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          />
        </div>
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[10px] font-medium text-[#94a3b8] uppercase">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => {
            const isCurrentMonth = isSameMonth(day, monthStart)
            const isSelected = (startDate && isSameDay(day, startDate)) || (endDate && isSameDay(day, endDate))
            const isInRange = startDate && endDate && isWithinInterval(day, { start: startDate, end: endDate })
            
            return (
              <button
                key={idx}
                disabled={!isCurrentMonth}
                onClick={() => handleDateClick(day)}
                className={clsx(
                  "h-8 w-8 rounded-lg text-[12px] font-medium transition-all flex items-center justify-center",
                  !isCurrentMonth && "opacity-0 pointer-events-none",
                  isSelected ? "bg-primary text-white shadow-lg" : 
                  isInRange ? "bg-[#dbeafe] text-primary rounded-none" : "hover:bg-gray-50 text-[#475569]",
                  !!(startDate && isSameDay(day, startDate)) && endDate && "rounded-r-none",
                  !!(endDate && isSameDay(day, endDate)) && "rounded-l-none"
                )}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative inline-block" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "bg-[#f8fafc] border border-gray-100 px-4 py-2 rounded-full h-8 flex items-center gap-2 min-w-[320px] shadow-inner cursor-pointer hover:bg-white transition-all group",
          isOpen && "ring-4 ring-primary/5 border-primary/20 bg-white"
        )}
      >
        <div className="flex items-center gap-2 flex-1 justify-center">
           <span className="text-[10px] font-medium text-[#94a3b8] uppercase opacity-60">From</span>
           <span className={clsx("text-[13px] font-medium", from ? "text-[#475569]" : "text-[#94a3b8] opacity-40")}>
             {from ? format(parseISO(from), 'dd/MM/yyyy') : '--/--/----'}
           </span>
        </div>
        
        <span className="text-gray-200 font-light px-1">|</span>
        
        <div className="flex items-center gap-2 flex-1 justify-center">
           <span className="text-[10px] font-medium text-[#94a3b8] uppercase opacity-60">To</span>
           <span className={clsx("text-[13px] font-medium", to ? "text-[#475569]" : "text-[#94a3b8] opacity-40")}>
             {to ? format(parseISO(to), 'dd/MM/yyyy') : '--/--/----'}
           </span>
        </div>

        <div className="flex items-center gap-1 ml-1">
           {(from || to) ? (
             <X onClick={clear} className="h-3 w-3 text-gray-400 hover:text-rose-500 transition-colors" />
           ) : (
             <CalendarIcon className="h-3.5 w-3.5 text-primary opacity-40" />
           )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 z-[110] bg-white border border-gray-100 rounded-3xl shadow-[0_30px_80px_rgba(0,0,0,0.12)] p-6 animate-in fade-in slide-in-from-top-4 duration-300 min-w-max">
          <div className="flex items-start gap-8">
             <button 
               onClick={() => setViewDate(subMonths(viewDate, 1))}
               className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-primary"
             >
               <ChevronLeft className="h-5 w-5" />
             </button>
             
             <div className="flex gap-10">
                {renderMonth(viewDate)}
                {renderMonth(addMonths(viewDate, 1))}
             </div>

             <button 
               onClick={() => setViewDate(addMonths(viewDate, 1))}
               className="p-2 hover:bg-gray-50 rounded-xl transition-colors text-gray-400 hover:text-primary"
             >
               <ChevronRight className="h-5 w-5" />
             </button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-50 flex justify-between items-center">
             <div className="flex gap-2">
                {['Today', 'Last 7 Days', 'This Month', 'Last Month'].map(label => (
                  <button 
                    key={label}
                    onClick={() => {
                      const end = new Date()
                      let start = new Date()
                      if (label === 'Last 7 Days') start = addDays(end, -7)
                      if (label === 'This Month') start = startOfMonth(end)
                      if (label === 'Last Month') {
                        const prev = subMonths(new Date(), 1)
                        start = startOfMonth(prev)
                        onChange?.(format(start, 'yyyy-MM-dd'), format(endOfMonth(prev), 'yyyy-MM-dd'))
                        setIsOpen(false)
                        return
                      }
                      onChange?.(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'))
                      setIsOpen(false)
                    }}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-primary/5 text-[#64748b] hover:text-primary rounded-lg text-[11px] font-medium transition-all"
                  >
                    {label}
                  </button>
                ))}
             </div>
             <button 
               onClick={() => setIsOpen(false)}
               className="px-6 py-2 bg-primary text-white rounded-xl text-[12px] font-medium shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
             >
               Apply Filter
             </button>
          </div>
        </div>
      )}
    </div>
  )
}
