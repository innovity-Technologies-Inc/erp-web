import React from 'react'
import { useUiStore } from '@/store/useUiStore'
import { Toast } from './Toast'

export const ToastContainer: React.FC = () => {
  const notifications = useUiStore((state) => state.notifications)
  const dismiss = useUiStore((state) => state.dismiss)

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end pointer-events-none">
      <div className="w-full max-w-sm pointer-events-auto">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => dismiss(notification.id)}
          />
        ))}
      </div>
    </div>
  )
}
