import { useUiStore } from '@/store/useUiStore'
import { Check, X, AlertTriangle, Info } from 'lucide-react'
import { clsx } from 'clsx'

export const NotificationModal = () => {
  const { modalNotification, hideNotificationModal } = useUiStore()
  const { isOpen, title, message, type } = modalNotification

  if (!isOpen) return null

  const config = {
    success: {
      icon: <Check className="h-12 w-12 text-white" strokeWidth={3} />,
      bgColor: 'bg-[#10b981]',
      titleColor: 'text-[#111827]',
    },
    error: {
      icon: <X className="h-12 w-12 text-white" strokeWidth={3} />,
      bgColor: 'bg-rose-500',
      titleColor: 'text-rose-600',
    },
    warning: {
      icon: <AlertTriangle className="h-12 w-12 text-white" strokeWidth={3} />,
      bgColor: 'bg-amber-500',
      titleColor: 'text-amber-600',
    },
    info: {
      icon: <Info className="h-12 w-12 text-white" strokeWidth={3} />,
      bgColor: 'bg-blue-500',
      titleColor: 'text-blue-600',
    },
  }

  const current = config[type] || config.success

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#1E3A5F]/30 backdrop-blur-[4px] transition-opacity animate-in fade-in duration-300"
        onClick={hideNotificationModal}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-[440px] rounded-[32px] p-10 shadow-[0_25px_70px_rgba(0,0,0,0.15)] flex flex-col items-center text-center animate-in zoom-in-95 fade-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={hideNotificationModal}
          className="absolute right-6 top-6 p-2 rounded-full hover:bg-gray-100 transition-colors group"
        >
          <X className="h-5 w-5 text-gray-300 group-hover:text-gray-500" strokeWidth={2} />
        </button>

        {/* Big Icon Container */}
        <div className={clsx(
          "w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-2xl",
          current.bgColor
        )}>
          {current.icon}
        </div>

        {/* Text Content */}
        <h2 className={clsx("text-[20px] font-medium tracking-tight mb-3 font-poppins", current.titleColor)}>
          {typeof title === 'string' ? title : JSON.stringify(title)}
        </h2>
        
        <div className="text-[12px] font-medium text-[#64748b] leading-relaxed mb-10 max-w-[320px] whitespace-pre-line">
          {(() => {
            if (typeof message === 'string') return message;
            if (typeof message === 'object' && message !== null) {
              const keys = Object.keys(message);
              if (keys.length > 0) {
                const firstVal = (message as any)[keys[0]];
                return Array.isArray(firstVal) ? String(firstVal[0]) : String(firstVal);
              }
              return JSON.stringify(message);
            }
            return String(message);
          })()}
        </div>

        {/* Action Button */}
        <button
          onClick={hideNotificationModal}
          className="w-32 py-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] text-[15px] font-medium rounded-2xl transition-all active:scale-95 shadow-sm"
        >
          Ok
        </button>
      </div>
    </div>
  )
}
