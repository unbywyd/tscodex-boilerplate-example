// Notification Store - cross-app notification system
// Simulates push notifications between apps

import { create } from 'zustand'

export interface AppNotification {
  id: string
  app: 'client' | 'specialist' | 'admin'
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'order'
  timestamp: number
  read: boolean
  data?: Record<string, unknown>
}

interface NotificationStore {
  notifications: AppNotification[]

  // Add notification
  add: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => void

  // Mark as read
  markRead: (id: string) => void
  markAllRead: (app: AppNotification['app']) => void

  // Get unread count for app
  getUnreadCount: (app: AppNotification['app']) => number

  // Get notifications for app
  getForApp: (app: AppNotification['app']) => AppNotification[]

  // Clear old notifications
  clearOld: () => void

  // Dismiss
  dismiss: (id: string) => void
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],

  add: (notification) => {
    const newNotification: AppNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      read: false,
    }

    set(state => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep max 50
    }))
  },

  markRead: (id) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      )
    }))
  },

  markAllRead: (app) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.app === app ? { ...n, read: true } : n
      )
    }))
  },

  getUnreadCount: (app) => {
    return get().notifications.filter(n => n.app === app && !n.read).length
  },

  getForApp: (app) => {
    return get().notifications.filter(n => n.app === app)
  },

  clearOld: () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    set(state => ({
      notifications: state.notifications.filter(n => n.timestamp > oneHourAgo)
    }))
  },

  dismiss: (id) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }))
  }
}))

// Helper to send notification to another app
export function notifyApp(
  targetApp: AppNotification['app'],
  title: string,
  message: string,
  type: AppNotification['type'] = 'info',
  data?: Record<string, unknown>
) {
  useNotificationStore.getState().add({
    app: targetApp,
    title,
    message,
    type,
    data
  })
}

// Hooks for components - use stable selectors to avoid infinite loops
export function useAppNotifications(app: AppNotification['app']) {
  return useNotificationStore(state =>
    state.notifications.filter(n => n.app === app)
  )
}

export function useUnreadCount(app: AppNotification['app']) {
  return useNotificationStore(state =>
    state.notifications.filter(n => n.app === app && !n.read).length
  )
}
