import { create } from 'zustand'

export type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  message: string
  type: NotificationType
}

interface NotificationModalState {
  isOpen: boolean
  title: string
  message: string
  type: NotificationType
}

interface UiState {
  sidebarOpen: boolean
  notifications: Notification[]
  modalNotification: NotificationModalState
  toggleSidebar: () => void
  notify: (message: string, type?: NotificationType) => void
  dismiss: (id: string) => void
  showNotificationModal: (title: string, message: string, type?: NotificationType) => void
  hideNotificationModal: () => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  notifications: [],
  modalNotification: {
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  notify: (message, type = 'info') => {
    const id = crypto.randomUUID()
    set((state) => ({
      notifications: [...state.notifications, { id, message, type }],
    }))
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }))
    }, 5000)
  },
  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  showNotificationModal: (title, message, type = 'success') =>
    set({
      modalNotification: { isOpen: true, title, message, type },
    }),
  hideNotificationModal: () =>
    set((state) => ({
      modalNotification: { ...state.modalNotification, isOpen: false },
    })),
}))
