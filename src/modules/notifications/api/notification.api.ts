import { apiClient } from '@/api/client'
import type { NotificationsResponse, UnreadCountResponse } from './types'

export const getNotifications = async (page: number = 1, perPage: number = 15): Promise<NotificationsResponse> => {
  const { data } = await apiClient.get<NotificationsResponse>('/notifications', {
    params: { page, per_page: perPage },
  })
  return data
}

export const getUnreadNotificationCount = async (): Promise<UnreadCountResponse> => {
  const { data } = await apiClient.get<UnreadCountResponse>('/notifications/unread-count')
  return data
}

export const markNotificationAsRead = async (id: string) => {
  const { data } = await apiClient.post(`/notifications/${id}/read`)
  return data
}

export const markAllNotificationsAsRead = async () => {
  const { data } = await apiClient.post('/notifications/mark-all-read')
  return data
}

export const deleteNotification = async (id: string) => {
  const { data } = await apiClient.delete(`/notifications/${id}`)
  return data
}
