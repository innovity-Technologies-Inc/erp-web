export interface NotificationData {
  type?: string
  rfq_id?: number
  rfq_no?: string
  title?: string
  message?: string
  closing_date?: string
  action_url?: string
  created_at?: string
  [key: string]: any
}

export interface AppNotification {
  id: string
  type: string
  notifiable_type: string
  notifiable_id: number
  data: NotificationData
  read_at: string | null
  created_at: string
  updated_at: string
}

export interface NotificationsResponse {
  status: boolean
  unread_count: number
  data: AppNotification[]
  pagination: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface UnreadCountResponse {
  status: boolean
  unread_count: number
}
