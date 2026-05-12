import React from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import type { NotificationType } from '@/store/useUiStore'

interface ToastProps {
  message: string
  type: NotificationType
  onClose: () => void
}

const icons = {
  success: <CheckCircle className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  warning: <AlertCircle className="h-5 w-5 text-warning" />,
  info: <Info className="h-5 w-5 text-info" />,
}

const bgColors = {
  success: 'bg-success/10 border-success/20',
  error: 'bg-danger/10 border-danger/20',
  warning: 'bg-warning/10 border-warning/20',
  info: 'bg-info/10 border-info/20',
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  return (
    <div className={`flex items-center p-4 mb-4 border rounded-lg shadow-md animate-in slide-in-from-right duration-300 ${bgColors[type]}`}>
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="ml-3 text-sm font-medium text-gray-800">{message}</div>
      <button
        onClick={onClose}
        className="ml-auto -mx-1.5 -my-1.5 bg-transparent text-gray-400 hover:text-gray-900 rounded-lg p-1.5 inline-flex h-8 w-8 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
