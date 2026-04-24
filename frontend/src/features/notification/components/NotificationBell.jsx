import { useNavigate } from 'react-router-dom'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import { useState, useRef, useEffect } from 'react'
import { formatDistanceToNow } from '../utils/timeUtils'

const typeIcon = {
  BOOKING_SUBMITTED: '📋',
  BOOKING_APPROVED: '✅',
  BOOKING_REJECTED: '❌',
  TICKET_SUBMITTED: '🎫',
  TICKET_ASSIGNED: '🔧',
  TICKET_MESSAGE: '💬',
}

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleNotificationClick(notification) {
    if (!notification.isRead) await markAsRead(notification.id)
    setOpen(false)
    if (notification.link) navigate(notification.link)
  }

  const preview = notifications.slice(0, 6)

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-white/55 hover:bg-white/10 hover:text-white transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-navy">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs text-brand hover:text-brand/80 font-medium"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {preview.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No notifications yet</div>
            ) : (
              preview.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 items-start ${!n.isRead ? 'bg-brand/5' : ''}`}
                >
                  <span className="text-lg leading-none mt-0.5">{typeIcon[n.type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-xs font-semibold truncate ${!n.isRead ? 'text-navy' : 'text-slate-600'}`}>
                        {n.title}
                      </p>
                      {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-brand mt-0.5" />}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatDistanceToNow(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5">
            <button
              onClick={() => { setOpen(false); navigate('/notifications') }}
              className="text-xs text-brand hover:text-brand/80 font-medium"
            >
              View all notifications →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
