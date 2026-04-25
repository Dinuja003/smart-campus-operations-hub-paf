import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { toast } from 'sonner'
import notificationService from '../services/notificationService'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const clientRef = useRef(null)

  const loadNotifications = useCallback(async () => {
    // Notification Flow: bootstrap feed from REST before realtime socket events arrive.
    try {
      const data = await notificationService.getAll()
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.isRead).length)
    } catch {
      // silently ignore — user may not be logged in yet
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('token')
    const userId = sessionStorage.getItem('userId')
    if (!token || !userId) return

    loadNotifications()

    // Notification Flow: authenticated STOMP session subscribes to per-user queue events.
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/user/${userId}/queue/notifications`, (frame) => {
          const notification = JSON.parse(frame.body)
          // Notification Flow: realtime push updates UI state and surfaces toast feedback.
          setNotifications(prev => [notification, ...prev])
          setUnreadCount(prev => prev + 1)
          toast.info(notification.title, { description: notification.message })
        })
      },
      onStompError: () => {},
      onDisconnect: () => {},
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [loadNotifications])

  const markAsRead = useCallback(async (id) => {
    // Notification Flow: optimistic local update after server marks a notification as read.
    await notificationService.markAsRead(id)
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [])

  const markAllRead = useCallback(async () => {
    // Notification Flow: bulk read operation synchronizes list and unread badge to zero.
    await notificationService.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }, [])

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllRead, reload: loadNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
