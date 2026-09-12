import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../api/notification.api'
import { useAuthStore } from '@/store/useAuthStore'

export const notificationKeys = {
  all: ['notifications'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  list: (page: number, perPage: number) => ['notifications', 'list', page, perPage] as const,
}

/**
 * Smart background polling hook for unread notifications count.
 * Polls every 20 seconds only when window/tab is active.
 */
export const useUnreadNotificationCount = () => {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadNotificationCount,
    enabled: !!user,
    refetchInterval: 20000,
    refetchIntervalInBackground: false,
    staleTime: 10000,
  })
}

/**
 * Fetch paginated notification list.
 */
export const useNotificationsList = (page: number = 1, perPage: number = 15, enabled: boolean = true) => {
  const user = useAuthStore((state) => state.user)

  return useQuery({
    queryKey: notificationKeys.list(page, perPage),
    queryFn: () => getNotifications(page, perPage),
    enabled: !!user && enabled,
    staleTime: 15000,
  })
}

/**
 * Mark a single notification as read.
 */
export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Mark all notifications as read.
 */
export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

/**
 * Delete a notification.
 */
export const useDeleteNotification = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
