import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck, ArrowRight } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import { formatDistanceToNow } from '../utils/timeUtils'

// Notification Flow: full-page inbox for persisted + realtime notification events.
const typeIcon = {
  BOOKING_SUBMITTED: '📋',
  BOOKING_APPROVED: '✅',
  BOOKING_REJECTED: '❌',
  TICKET_SUBMITTED: '🎫',
  TICKET_ASSIGNED: '🔧',
  TICKET_MESSAGE: '💬',
}

const typeLabel = {
  BOOKING_SUBMITTED: 'Booking',
  BOOKING_APPROVED: 'Booking',
  BOOKING_REJECTED: 'Booking',
  TICKET_SUBMITTED: 'Ticket',
  TICKET_ASSIGNED: 'Ticket',
  TICKET_MESSAGE: 'Message',
}

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const readCount = notifications.length - unreadCount

  async function handleClick(n) {
    // Notification Flow: opening an item marks it read, then routes to the linked entity.
    if (!n.isRead) await markAsRead(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">WORKSPACE · NOTIFICATIONS</p>
        <div className="mt-1.5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[2rem] font-bold leading-tight text-navy">Updates, in one feed.</h1>
            <p className="mt-1 text-sm text-[#5a6b98]">
              Track booking and ticket events in real time across your workspace.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 rounded-xl border border-brand/30 bg-brand/5 px-3 py-2 text-sm font-semibold text-brand hover:bg-brand/10 transition-colors"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Total", value: notifications.length, cls: "bg-[#001d45] text-white" },
          { label: "Unread", value: unreadCount, cls: "bg-brand text-white" },
          { label: "Read", value: readCount, cls: "bg-emerald-500 text-white" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl px-4 py-3 ${s.cls}`}>
            <p className="text-xl font-bold leading-none">{s.value}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[20px] border border-white/60 bg-white shadow-[0_14px_40px_rgba(21,32,85,0.08)] overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 mb-4">
              <Bell className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-navy">No notifications yet</p>
            <p className="text-sm text-slate-400 mt-1">You'll see updates here when something happens.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex items-start gap-4 group ${!n.isRead ? 'bg-brand/5' : ''}`}
              >
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${!n.isRead ? 'bg-brand/10' : 'bg-slate-100'}`}>
                  {typeIcon[n.type] ?? '🔔'}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`text-[10px] font-bold tracking-widest uppercase ${!n.isRead ? 'text-brand' : 'text-slate-400'}`}>
                        {typeLabel[n.type] ?? 'System'}
                      </span>
                      <p className={`text-sm font-semibold mt-0.5 ${!n.isRead ? 'text-navy' : 'text-slate-600'}`}>
                        {n.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand" />}
                      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDistanceToNow(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
