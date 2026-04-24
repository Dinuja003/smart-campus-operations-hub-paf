import { useEffect, useMemo, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom"
import HomePage from "./pages/HomePage"
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Database,
  Loader2,
  ShieldCheck,
  Sparkles,
  Ticket,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react"
import { SidebarProvider } from "./components/ui/sidebar"
import { AppSidebar } from "./components/AppSidebar"
import MyBookingsPage from "./features/booking/pages/MyBookingsPage"
import AdminBookingsPage from "./features/booking/pages/AdminBookingsPage"
import LoginPage from "./features/auth/pages/LoginPage"
import SignupPage from "./features/auth/pages/SignupPage"
import OAuth2CallbackPage from "./features/auth/pages/OAuth2CallbackPage"
import ProtectedRoute from "./features/auth/components/ProtectedRoute"
import ProfilePage from "./features/auth/pages/ProfilePage"
import { UserProfileProvider } from "./features/users/context/UserProfileContext"
import bookingService from "./features/booking/Services/BookingService"
import resourceService from "./features/resources/services/resourceService"
import AdminResourcesInterface from "./features/resources/AdminResourcesInterface.jsx"
import CreateTicketPage from "./features/ticket/pages/CreateTicketPage"
import AnalyticsPage from "./features/booking/pages/AnalyticsPage"
import UserManagementPage from "./features/users/pages/UserManagementPage.jsx"
import MyTicketsPage from "./features/ticket/pages/MyTicketsPage"
import AdminTicketsPage from "./features/ticket/pages/AdminTicketsPage"
import TicketDetailPage from "./features/ticket/pages/TicketDetailPage"
import { Toaster } from "sonner"
import ChatBot from "./components/ChatBot"   // ← NEW
import { NotificationProvider } from "./features/notification/context/NotificationContext"
import NotificationsPage from "./features/notification/pages/NotificationsPage"

const actionConfigByRole = {
  USER: [
    {
      label: "My Bookings",
      subtitle: "Track and manage only your booking requests",
      icon: CalendarCheck2,
      path: "/my-bookings",
      gradient: "from-orange-500 to-orange-600",
      light: false,
    },
    {
      label: "My Tickets",
      subtitle: "Create and follow your support tickets",
      icon: Ticket,
      path: "/tickets",
      gradient: "from-slate-700 to-slate-800",
      light: false,
    },
  ],
  ADMIN: [
    {
      label: "All Bookings",
      subtitle: "Review requests submitted by all users",
      icon: ShieldCheck,
      path: "/admin/bookings",
      gradient: "from-orange-500 to-orange-600",
      light: false,
    },
    {
      label: "Analytics",
      subtitle: "View peak hours and booking trends",
      icon: TrendingUp,
      path: "/analytics",
      gradient: "from-blue-600 to-blue-700",
      light: false,
    },
    {
      label: "Resources",
      subtitle: "Monitor and update campus resources",
      icon: Wrench,
      path: "/resources",
      gradient: "from-teal-600 to-teal-700",
      light: false,
    },
    {
      label: "My Bookings",
      subtitle: "Open your personal booking workspace",
      icon: CalendarCheck2,
      path: "/my-bookings",
      gradient: "from-slate-700 to-slate-800",
      light: false,
    },
  ],
  TECHNICIAN: [
    {
      label: "Resources",
      subtitle: "Inspect status and maintenance readiness",
      icon: Wrench,
      path: "/resources",
      gradient: "from-teal-600 to-teal-700",
      light: false,
    },
    {
      label: "Tickets",
      subtitle: "Open technical task queue",
      icon: Ticket,
      path: "/admin/tickets",
      gradient: "from-slate-700 to-slate-800",
      light: false,
    },
  ],
}

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

function formatRelativeTime(value) {
  if (!value) return "No timestamp"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "No timestamp"
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.floor(diffMs / 60000)
  if (diffMinutes < 1) return "just now"
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
}

function readableStatus(status) {
  if (!status) return "UNKNOWN"
  return String(status).toUpperCase()
}

function Dashboard() {
  const navigate = useNavigate()
  const role = (sessionStorage.getItem("role") || "USER").toUpperCase()
  const email = sessionStorage.getItem("email") || "operator@smartcampus.local"

  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [liveNow, setLiveNow] = useState(new Date())

  useEffect(() => {
    let active = true
    async function loadDashboardData() {
      setLoading(true)
      setError("")
      try {
        if (role === "ADMIN") {
          const [allBookings, allResources] = await Promise.all([
            bookingService.getAllBookings(),
            resourceService.getAllResources(),
          ])
          if (!active) return
          setBookings(normalizeList(allBookings))
          setResources(normalizeList(allResources))
          return
        }
        if (role === "USER") {
          const myBookings = await bookingService.getMyBookings()
          if (!active) return
          setBookings(normalizeList(myBookings))
          setResources([])
          return
        }
        const allResources = await resourceService.getAllResources()
        if (!active) return
        setBookings([])
        setResources(normalizeList(allResources))
      } catch (requestError) {
        if (!active) return
        setError(
          requestError?.response?.data?.message ||
            requestError?.response?.data ||
            requestError?.message ||
            "Failed to load dashboard data."
        )
      } finally {
        if (active) setLoading(false)
      }
    }
    loadDashboardData()
    return () => {
      active = false
    }
  }, [role])

  useEffect(() => {
    const timer = window.setInterval(() => setLiveNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const bookingStats = useMemo(() => {
    const total = bookings.length
    const pending = bookings.filter((b) => readableStatus(b.status) === "PENDING").length
    const approved = bookings.filter((b) => readableStatus(b.status) === "APPROVED").length
    const now = new Date()
    const upcoming = bookings.filter((b) => {
      if (!b.date || !b.startTime) return false
      const slot = new Date(`${b.date}T${b.startTime}:00`)
      return !Number.isNaN(slot.getTime()) && slot >= now
    }).length
    return { total, pending, approved, upcoming }
  }, [bookings])

  const resourceStats = useMemo(() => {
    const totalResources = resources.length
    const availableResources = resources.filter(
      (r) => String(r.status || "").toUpperCase() === "AVAILABLE"
    ).length
    const maintenanceResources = resources.filter((r) =>
      String(r.status || "").toUpperCase().includes("MAINTENANCE")
    ).length
    const totalCapacity = resources.reduce((sum, r) => sum + Number(r.capacity || 0), 0)
    return { totalResources, availableResources, maintenanceResources, totalCapacity }
  }, [resources])

  const metricCards = useMemo(() => {
    if (role === "ADMIN") {
      return [
        {
          title: "Total Bookings",
          value: String(bookingStats.total),
          sub: "All time",
          icon: Users,
          iconColor: "text-white",
          iconBg: "bg-brand",
        },
        {
          title: "Upcoming",
          value: String(bookingStats.upcoming),
          sub: "This week",
          icon: CalendarCheck2,
          iconColor: "text-white",
          iconBg: "bg-emerald-500",
        },
        {
          title: "Pending Review",
          value: String(bookingStats.pending),
          sub: "Awaiting",
          icon: Clock3,
          iconColor: "text-white",
          iconBg: "bg-[#f5b800]",
        },
        {
          title: "Campus Resources",
          value: String(resourceStats.totalResources),
          sub: `${resourceStats.availableResources} available`,
          icon: Database,
          iconColor: "text-white",
          iconBg: "bg-[#152055]",
        },
      ]
    }

    if (role === "USER") {
      return [
        {
          title: "Total Bookings",
          value: String(bookingStats.total),
          sub: "All time",
          icon: CalendarCheck2,
          iconColor: "text-white",
          iconBg: "bg-brand",
        },
        {
          title: "Upcoming",
          value: String(bookingStats.upcoming),
          sub: "This week",
          icon: Clock3,
          iconColor: "text-white",
          iconBg: "bg-emerald-500",
        },
        {
          title: "Pending Review",
          value: String(bookingStats.pending),
          sub: "Awaiting",
          icon: AlertCircle,
          iconColor: "text-white",
          iconBg: "bg-[#f5b800]",
        },
        {
          title: "Approved",
          value: String(bookingStats.approved),
          sub: "Ready to use",
          icon: ShieldCheck,
          iconColor: "text-white",
          iconBg: "bg-emerald-500",
        },
      ]
    }

    return [
      {
        title: "Resources",
        value: String(resourceStats.totalResources),
        sub: `${resourceStats.availableResources} available`,
        icon: Database,
        iconColor: "text-white",
        iconBg: "bg-brand",
      },
      {
        title: "Maintenance",
        value: String(resourceStats.maintenanceResources),
        sub: "Need attention",
        icon: Wrench,
        iconColor: "text-white",
        iconBg: "bg-[#f5b800]",
      },
      {
        title: "Total Capacity",
        value: String(resourceStats.totalCapacity),
        sub: "Across all resources",
        icon: Users,
        iconColor: "text-white",
        iconBg: "bg-emerald-500",
      },
      {
        title: "Available",
        value: String(resourceStats.availableResources),
        sub: "Ready now",
        icon: ShieldCheck,
        iconColor: "text-white",
        iconBg: "bg-[#152055]",
      },
    ]
  }, [bookingStats, resourceStats, role])

  const quickActions = actionConfigByRole[role] || actionConfigByRole.USER

  const recentActivity = useMemo(() => {
    if (bookings.length === 0) return []
    return bookings.slice(0, 5).map((booking) => {
      const status = readableStatus(booking.status)
      const resourceLabel = booking.resourceType || "Resource"
      const ownerLabel = role === "ADMIN" ? booking.requestedBy || "unknown" : ""
      return {
        id: booking.id,
        title: resourceLabel,
        owner: ownerLabel,
        date: booking.date || "-",
        time: booking.startTime && booking.endTime ? `${booking.startTime}-${booking.endTime}` : "-",
        relativeTime: formatRelativeTime(booking.updatedAt || booking.createdAt),
        status,
      }
    })
  }, [bookings, role])

  const hour = liveNow.getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const roleLabel =
    role === "ADMIN" ? "Admin Workspace" : role === "USER" ? "User Workspace" : "Technician Workspace"
  const pendingAlerts =
    role === "ADMIN"
      ? bookingStats.pending
      : role === "USER"
        ? bookingStats.pending
        : resourceStats.maintenanceResources
  const subtitleByRole =
    role === "ADMIN"
      ? "Live data from all users and resources across the campus."
      : role === "USER"
        ? "Only your booking data is shown here from the database."
        : "Technical operations summary from campus resources."

  const statusColors = {
    PENDING: "bg-orange-100 text-orange-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700",
    CANCELLED: "bg-slate-100 text-slate-600",
  }

  const displayName =
    email
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Campus Operator"

  const clockLabel = liveNow.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const dateLabel = liveNow.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">OVERVIEW · DASHBOARD</p>
          <h1 className="mt-1.5 text-[2.35rem] font-bold leading-tight text-navy">Operations cockpit.</h1>
          <p className="mt-1 text-sm text-[#5a6b98]">{subtitleByRole}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-right shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">Live Clock</p>
          <p className="text-lg font-bold text-navy">{clockLabel}</p>
          <p className="text-[11px] text-[#8494c2]">{dateLabel}</p>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-gradient-to-r from-[#001d45] via-[#0f2e63] to-[#1c3f77] p-6 text-white shadow-[0_20px_50px_rgba(21,32,85,0.25)]">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand/30 blur-3xl" />
        <div className="pointer-events-none absolute left-20 top-16 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid gap-4 lg:grid-cols-[1.8fr_1fr]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{roleLabel}</p>
            <h2 className="mt-2 text-3xl font-bold leading-tight text-white">{greeting}, {displayName}.</h2>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              A fresh command view with active demand, queue pressure and direct execution links.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Pending Alerts</p>
              <p className="mt-1 text-2xl font-bold">{pendingAlerts}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Bookings</p>
              <p className="mt-1 text-2xl font-bold">{bookingStats.total}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Resources</p>
              <p className="mt-1 text-2xl font-bold">{resourceStats.totalResources}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Available</p>
              <p className="mt-1 text-2xl font-bold">{resourceStats.availableResources}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.title} className="group rounded-[20px] border border-white/60 bg-white p-4 shadow-[0_8px_30px_rgba(21,32,85,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_40px_rgba(21,32,85,0.14)]">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{card.title}</p>
                  <p className="mt-1 text-3xl font-bold leading-none text-navy">{loading ? "—" : card.value}</p>
                  <p className="mt-1 text-xs text-[#8494c2]">{card.sub}</p>
                </div>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </span>
              </div>
            </article>
          )
        })}
      </section>

      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <div className="overflow-hidden rounded-[24px] border border-white/60 bg-white shadow-[0_14px_40px_rgba(21,32,85,0.10)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-base font-bold text-navy">Live Activity Stream</h3>
              <p className="mt-0.5 text-xs text-[#8494c2]">Recent booking flow and status signals</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(role === "ADMIN" ? "/admin/bookings" : "/my-bookings")}
              className="text-sm font-medium text-brand hover:underline"
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-2.5 p-5 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" /> Loading...
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-6 text-sm text-[#8494c2]">No records yet.</div>
          ) : (
            <div className="space-y-2 p-4">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-navy">{item.title}</p>
                    <p className="text-[11px] text-[#8494c2]">{item.owner ? `${item.owner} · ` : ""}{item.date} · {item.time}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColors[item.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[24px] border border-white/60 bg-white p-5 shadow-[0_14px_40px_rgba(21,32,85,0.10)]">
            <h3 className="text-base font-bold text-navy">Direct Actions</h3>
            <p className="mt-0.5 text-xs text-[#8494c2]">Jump into the tools you use most</p>
            <div className="mt-4 grid gap-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.path}
                    type="button"
                    onClick={() => navigate(action.path)}
                    className="group flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3.5 py-3 text-left transition hover:border-brand/30 hover:bg-brand/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#001d45] text-white">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-navy">{action.label}</p>
                        <p className="text-[11px] text-[#8494c2]">{action.subtitle}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#8494c2] group-hover:text-brand" />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="rounded-[24px] border border-white/60 bg-[#001d45] p-5 text-white shadow-[0_14px_40px_rgba(21,32,85,0.25)]">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Queue Pressure</p>
              <Bell className="h-4 w-4 text-[#f5b800]" />
            </div>
            <p className="mt-2 text-3xl font-bold">{pendingAlerts}</p>
            <p className="text-xs text-white/60">items awaiting action</p>
            <div className="mt-3 h-2 rounded-full bg-white/15">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, pendingAlerts * 12 + 8)}%` }} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[26px] border border-white/60 bg-white py-24 shadow-[0_14px_40px_rgba(21,32,85,0.08)] text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
        <Sparkles className="h-6 w-6 text-brand" />
      </div>
      <p className="mt-4 text-lg font-bold text-navy">{title}</p>
      <p className="mt-1 text-sm text-[#8494c2]">This screen is coming soon.</p>
    </div>
  )
}

function RoleRoute({ allowedRoles, children }) {
  const role = (sessionStorage.getItem("role") || "").toUpperCase()
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />
  return children
}

function AppShell() {
  return (
    <NotificationProvider>
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#eef2fb]">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <Toaster position="top-right" richColors />
          <div className="mx-auto w-full max-w-6xl">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route
                path="/admin/bookings"
                element={
                  <RoleRoute allowedRoles={["ADMIN"]}>
                    <AdminBookingsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <RoleRoute allowedRoles={["ADMIN"]}>
                    <AnalyticsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/resources"
                element={
                  <RoleRoute allowedRoles={["ADMIN", "TECHNICIAN"]}>
                    <AdminResourcesInterface />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <RoleRoute allowedRoles={["ADMIN"]}>
                    <UserManagementPage />
                  </RoleRoute>
                }
              />
              <Route path="/tickets" element={<MyTicketsPage />} />
              <Route path="/tickets/create" element={<CreateTicketPage />} />
              <Route path="/tickets/edit/:id" element={<CreateTicketPage />} />
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
              <Route
                path="/admin/tickets"
                element={
                  <RoleRoute allowedRoles={["ADMIN", "TECHNICIAN"]}>
                    <AdminTicketsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/admin/tickets/:id"
                element={
                  <RoleRoute allowedRoles={["ADMIN", "TECHNICIAN"]}>
                    <TicketDetailPage />
                  </RoleRoute>
                }
              />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/invoices" element={<ComingSoon title="Invoices" />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      {/* ── UniBot Chatbot — floats on every page ── */}
      <ChatBot />
    </SidebarProvider>
    </NotificationProvider>
  )
}

function AuthRoute({ children }) {
  const token = sessionStorage.getItem("token")
  return token ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <UserProfileProvider>
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <HomePage />
              <ChatBot />
            </>
          }
        />
        <Route
          path="/home"
          element={
            <>
              <HomePage />
              <ChatBot />
            </>
          }
        />
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/signup" element={<AuthRoute><SignupPage /></AuthRoute>} />
        <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute allowedRoles={["USER", "ADMIN", "TECHNICIAN"]}>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
    </UserProfileProvider>
  )
}

export default App
