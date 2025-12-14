// AppNotifications - In-app notification bell and dropdown
// Shows notifications from other apps (e.g., new orders, assignments)

import { useState, useEffect, useRef, useMemo } from 'react'
import { Bell, X, ClipboardList, Clock, CheckCircle2 } from 'lucide-react'
import { Button, Card, CardContent } from '@/components/ui'
import { useNotificationStore, type AppNotification } from '@prototype/stores/notificationStore'

interface AppNotificationsProps {
  app: 'client' | 'specialist' | 'admin'
  onNotificationClick?: (notification: AppNotification) => void
}

const typeIcons = {
  info: Bell,
  success: CheckCircle2,
  warning: Clock,
  order: ClipboardList,
}

const typeColors = {
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-green-100 text-green-600',
  warning: 'bg-amber-100 text-amber-600',
  order: 'bg-cyan-100 text-cyan-600',
}

export function NotificationBell({ app, onNotificationClick }: AppNotificationsProps) {
  const [open, setOpen] = useState(false)
  const allNotifications = useNotificationStore(state => state.notifications)
  // Get actions directly from store to avoid recreation on every render
  const { markRead, markAllRead, dismiss } = useNotificationStore.getState()

  // Memoize filtered notifications to avoid infinite loops
  const notifications = useMemo(
    () => allNotifications.filter(n => n.app === app),
    [allNotifications, app]
  )
  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  )

  const handleNotificationClick = (notification: AppNotification) => {
    markRead(notification.id)
    onNotificationClick?.(notification)
    setOpen(false)
  }

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Dropdown */}
          <Card className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden z-50 shadow-lg">
            <div className="p-3 border-b flex items-center justify-between">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => markAllRead(app)}
                >
                  Mark all read
                </Button>
              )}
            </div>

            <div className="overflow-auto max-h-72">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => {
                  const Icon = typeIcons[notification.type]
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-1.5 shrink-0 ${typeColors[notification.type]}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm line-clamp-1">
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                dismiss(notification.id)
                              }}
                              className="text-muted-foreground hover:text-foreground shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTime(notification.timestamp)}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// Floating notification toast for important events
export function NotificationToast({ app }: { app: AppNotification['app'] }) {
  const [shownId, setShownId] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const allNotifications = useNotificationStore(state => state.notifications)

  // Get the most recent unread notification for this app (memoized)
  const latestUnread = useMemo(
    () => allNotifications.find(n => n.app === app && !n.read),
    [allNotifications, app]
  )

  // Show toast when new notification arrives
  const latestUnreadId = latestUnread?.id
  useEffect(() => {
    if (latestUnreadId && latestUnreadId !== shownId) {
      setShownId(latestUnreadId)

      // Clear previous timer
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      // Auto-hide after 5 seconds
      timerRef.current = setTimeout(() => {
        useNotificationStore.getState().markRead(latestUnreadId)
        setShownId(null)
      }, 5000)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [latestUnreadId, shownId])

  if (!latestUnread || shownId !== latestUnread.id) return null

  const Icon = typeIcons[latestUnread.type]

  const handleDismiss = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    useNotificationStore.getState().markRead(latestUnread.id)
    setShownId(null)
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 fade-in duration-300">
      <Card className="shadow-lg border-l-4 border-l-cyan-500">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={`rounded-lg p-1.5 ${typeColors[latestUnread.type]}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">{latestUnread.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {latestUnread.message}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationBell
