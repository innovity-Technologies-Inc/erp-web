import { AlertTriangle, X } from 'lucide-react'
import { Modal } from '../Modal/Modal'
import { Button } from '../Button/Button'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: 'danger' | 'warning' | 'info'
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}: ConfirmationModalProps) => {
  const variantConfig = {
    danger: {
      icon: <AlertTriangle className="h-12 w-12 text-rose-500" />,
      buttonVariant: 'danger' as const,
      iconBg: 'bg-rose-50',
    },
    warning: {
      icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
      buttonVariant: 'warning' as const,
      iconBg: 'bg-amber-50',
    },
    info: {
      icon: <AlertTriangle className="h-12 w-12 text-blue-500" />,
      buttonVariant: 'primary' as const,
      iconBg: 'bg-blue-50',
    },
  }

  const current = variantConfig[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton={false}
      size="sm"
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className={`w-20 h-20 ${current.iconBg} rounded-full flex items-center justify-center mb-6`}>
          {current.icon}
        </div>

        <h2 className="text-[20px] font-medium text-[#1e293b] mb-2 tracking-tight">
          {title}
        </h2>
        
        <p className="text-[14px] font-medium text-[#64748b] leading-relaxed mb-8 max-w-[280px]">
          {message}
        </p>

        <div className="flex gap-3 w-full">
          <Button 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 rounded-xl h-11"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button 
            variant={variant} 
            onClick={onConfirm} 
            className="flex-1 rounded-xl h-11"
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
