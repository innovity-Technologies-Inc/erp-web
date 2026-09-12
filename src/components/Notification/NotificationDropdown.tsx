import React, { useState, useRef, useEffect } from 'react'
import {
  Bell,
  CheckCheck,
  FileText,
  Clock,
  ExternalLink,
  Trash2,
  Inbox,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { clsx } from 'clsx'
import {
  useUnreadNotificationCount,
  useNotificationsList,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  type AppNotification,
} from '@/modules/notifications'

// Helper for formatting time ago
const formatTimeAgo = (dateString?: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Polling unread count every 20s
  const { data: countData } = useUnreadNotificationCount()
  const unreadCount = countData?.unread_count ?? 0

  // Fetch list only when dropdown is opened (or pre-fetched)
  const { data: notificationsData, isLoading } = useNotificationsList(1, 20, isOpen)
  const notifications = notificationsData?.data || []

  // Mutations
  const { mutate: markAsRead } = useMarkNotificationAsRead()
  const { mutate: markAllAsRead, isPending: isMarkingAll } = useMarkAllNotificationsAsRead()
  const { mutate: deleteNotification } = useDeleteNotification()

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleNotificationClick = (notification: AppNotification) => {
    if (!notification.read_at) {
      markAsRead(notification.id)
    }

    const actionUrl = notification.data?.action_url
    if (actionUrl) {
      try {
        const url = new URL(actionUrl, window.location.origin)
        if (url.origin === window.location.origin) {
          const searchParams = Object.fromEntries(url.searchParams.entries())
          navigate({
            to: url.pathname as any,
            search: Object.keys(searchParams).length > 0 ? (searchParams as any) : undefined,
          })
        } else {
          window.location.href = actionUrl
        }
      } catch {
        try {
          navigate({ to: actionUrl as any })
        } catch {
          window.location.href = actionUrl
        }
      }
    } else if (notification.data?.rfq_id) {
      navigate({ to: `/procurement/rfqs/view/${notification.data.rfq_id}` as any })
    }

    setIsOpen(false)
  }

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (unreadCount > 0 && !isMarkingAll) {
      markAllAsRead()
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "p-2 rounded-xl transition-all relative outline-none",
          isOpen ? "bg-blue-50 text-primary shadow-inner" : "text-[#94a3b8] hover:text-primary hover:bg-slate-50"
        )}
        title="Notifications"
      >
        <Bell className="h-5.5 w-5.5" />
        
        {/* Dynamic Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white animate-in zoom-in shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 py-0 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-poppins text-[#475569]">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-[12px] font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-7 h-7 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-[12px] text-gray-400 font-medium">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-3">
                  <Inbox className="h-6 w-6" />
                </div>
                <h4 className="text-[13px] font-semibold text-slate-700 mb-1">No notifications yet</h4>
                <p className="text-[11px] text-gray-400 max-w-[200px]">
                  When new RFQ invitations or alerts arrive, they will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read_at
                const isRFQ = n.data?.type === 'rfq_invitation' || !!n.data?.rfq_id

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={clsx(
                      "px-4 py-3.5 flex items-start gap-3 cursor-pointer transition-colors relative group",
                      isUnread ? "bg-blue-50/40 hover:bg-blue-50/70" : "hover:bg-slate-50"
                    )}
                  >
                    {/* Unread indicator bar */}
                    {isUnread && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                    )}

                    {/* Icon */}
                    <div
                      className={clsx(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm",
                        isRFQ
                          ? "bg-blue-100 text-blue-600"
                          : "bg-purple-100 text-purple-600"
                      )}
                    >
                      {isRFQ ? <FileText className="h-4.5 w-4.5" /> : <Sparkles className="h-4.5 w-4.5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[12px] font-bold text-slate-800 truncate">
                          {n.data?.title || 'Notification'}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                          {formatTimeAgo(n.created_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 mb-1.5 font-normal">
                        {n.data?.message || 'You have a new update.'}
                      </p>

                      {/* RFQ Meta Tags */}
                      {n.data?.rfq_no && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded-md">
                            {n.data.rfq_no}
                          </span>
                          {n.data.closing_date && (
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Closes: {n.data.closing_date}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0 pt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(n.id)
                        }}
                        className="p-1 hover:bg-rose-50 text-gray-400 hover:text-rose-500 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2.5 bg-slate-50 border-t border-gray-100 text-center">
              <span className="text-[11px] text-gray-400 font-medium">
                Live notification sync active
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
