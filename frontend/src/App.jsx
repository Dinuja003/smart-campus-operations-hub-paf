import { useEffect, useMemo, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom"
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CalendarCheck2,
  Clock3,
  Database,
  Loader2,
  ShieldCheck,
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
import bookingService from "./features/booking/Services/BookingService"
import resourceService from "./features/resources/services/resourceService"
import AdminResourcesInterface from "./features/resources/AdminResourcesInterface.jsx"
import CreateTicketPage from "./features/ticket/pages/CreateTicketPage"

const actionConfigByRole = {
  USER: [
    {
      label: "My Bookings",
      subtitle: "Track and manage only your booking requests",
      icon: CalendarCheck2,
      path: "/my-bookings",
      className: "from-blue-600 to-blue-500",
    },
    {
      label: "My Tickets",
      subtitle: "Create and follow your support tickets",
      icon: Ticket,
      path: "/tickets",
      className: "from-slate-800 to-slate-700",
    },
  ],
  ADMIN: [
    {
      label: "All Bookings",
      subtitle: "Review requests submitted by all users",
      icon: ShieldCheck,
      path: "/admin/bookings",
      className: "from-blue-700 to-indigo-600",
    },
    {
      label: "Resources",
      subtitle: "Monitor and update campus resources",
      icon: Wrench,
      path: "/resources",
      className: "from-teal-700 to-teal-600",
    },
    {
      label: "My Bookings",
      subtitle: "Open your personal booking workspace",
      icon: CalendarCheck2,
      path: "/my-bookings",
      className: "from-slate-800 to-slate-700",
    },
  ],
  TECHNICIAN: [
    {
      label: "Resources",
      subtitle: "Inspect status and maintenance readiness",
      icon: Wrench,
      path: "/resources",
      className: "from-teal-700 to-teal-600",
    },
    {
      label: "Tickets",
      subtitle: "Open technical task queue",
      icon: Ticket,
      path: "/tickets",
      className: "from-slate-800 to-slate-700",
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
  const role = (localStorage.getItem("role") || "USER").toUpperCase()
  const userEmail = localStorage.getItem("email") || ""
  const userId = localStorage.getItem("userId") || ""

  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
            "Failed to load dashboard data from database."
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

  const bookingStats = useMemo(() => {
    const total = bookings.length
    const pending = bookings.filter((booking) => readableStatus(booking.status) === "PENDING").length
    const approved = bookings.filter((booking) => readableStatus(booking.status) === "APPROVED").length

    const now = new Date()
    const upcoming = bookings.filter((booking) => {
      if (!booking.date || !booking.startTime) return false
      const slot = new Date(`${booking.date}T${booking.startTime}:00`)
      return !Number.isNaN(slot.getTime()) && slot >= now
    }).length

    return { total, pending, approved, upcoming }
  }, [bookings])

  const resourceStats = useMemo(() => {
    const totalResources = resources.length
    const availableResources = resources.filter(
      (resource) => String(resource.status || "").toUpperCase() === "AVAILABLE"
    ).length
    const maintenanceResources = resources.filter((resource) =>
      String(resource.status || "").toUpperCase().includes("MAINTENANCE")
    ).length
    const totalCapacity = resources.reduce((sum, resource) => sum + Number(resource.capacity || 0), 0)

    return { totalResources, availableResources, maintenanceResources, totalCapacity }
  }, [resources])

  const metricCards = useMemo(() => {
    if (role === "ADMIN") {
      return [
        {
          title: "All Booking Requests",
          value: String(bookingStats.total),
          trend: `${bookingStats.pending} pending review`,
          icon: Users,
          color: "text-blue-700",
          bg: "bg-blue-50",
        },
        {
          title: "Approved Bookings",
          value: String(bookingStats.approved),
          trend: `${bookingStats.upcoming} upcoming`,
          icon: CalendarCheck2,
          color: "text-emerald-700",
          bg: "bg-emerald-50",
        },
        {
          title: "Campus Resources",
          value: String(resourceStats.totalResources),
          trend: `${resourceStats.availableResources} available now`,
          icon: Database,
          color: "text-teal-700",
          bg: "bg-teal-50",
        },
      ]
    }

    if (role === "USER") {
      return [
        {
          title: "My Bookings",
          value: String(bookingStats.total),
          trend: `${bookingStats.upcoming} upcoming`,
          icon: CalendarCheck2,
          color: "text-blue-700",
          bg: "bg-blue-50",
        },
        {
          title: "Pending Requests",
          value: String(bookingStats.pending),
          trend: "Waiting for admin review",
          icon: Clock3,
          color: "text-amber-700",
          bg: "bg-amber-50",
        },
        {
          title: "Approved",
          value: String(bookingStats.approved),
          trend: "Ready to use",
          icon: ShieldCheck,
          color: "text-emerald-700",
          bg: "bg-emerald-50",
        },
      ]
    }

    return [
      {
        title: "Resources",
        value: String(resourceStats.totalResources),
        trend: `${resourceStats.availableResources} available`,
        icon: Database,
        color: "text-teal-700",
        bg: "bg-teal-50",
      },
      {
        title: "Maintenance",
        value: String(resourceStats.maintenanceResources),
        trend: "Require technical attention",
        icon: Wrench,
        color: "text-amber-700",
        bg: "bg-amber-50",
      },
      {
        title: "Total Capacity",
        value: String(resourceStats.totalCapacity),
        trend: "Across all resources",
        icon: Users,
        color: "text-blue-700",
        bg: "bg-blue-50",
      },
    ]
  }, [bookingStats.approved, bookingStats.pending, bookingStats.total, bookingStats.upcoming, resourceStats.availableResources, resourceStats.maintenanceResources, resourceStats.totalCapacity, resourceStats.totalResources, role])

  const quickActions = actionConfigByRole[role] || actionConfigByRole.USER

  const recentActivity = useMemo(() => {
    if (bookings.length === 0) return []

    return bookings.slice(0, 5).map((booking) => {
      const status = readableStatus(booking.status)
      const title = booking.resourceType
        ? `${booking.resourceType} booking ${status.toLowerCase()}`
        : `Booking ${status.toLowerCase()}`
      const ownerLabel = role === "ADMIN" ? ` by user ${booking.requestedBy || "unknown"}` : ""

      return {
        id: booking.id,
        title,
        note: `${booking.date || "No date"} ${booking.startTime || ""}-${booking.endTime || ""}${ownerLabel}`.trim(),
        time: formatRelativeTime(booking.updatedAt || booking.createdAt),
      }
    })
  }, [bookings, role])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const roleLabel = role === "ADMIN" ? "Admin Workspace" : role === "USER" ? "User Workspace" : "Technician Workspace"

  const pendingAlerts = role === "ADMIN" ? bookingStats.pending : role === "USER" ? bookingStats.pending : resourceStats.maintenanceResources

  const subtitleByRole =
    role === "ADMIN"
      ? "Live data from all users and resources across the campus."
      : role === "USER"
        ? "Only your booking data is shown here from the database."
        : "Technical operations summary from campus resources."

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 text-white shadow-[0_24px_60px_-30px_rgba(2,6,23,0.85)] sm:p-7">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <p className="text-xs tracking-[0.18em] text-blue-200 uppercase">{roleLabel}</p>
            <h2 className="m-0 text-2xl font-semibold sm:text-3xl">{greeting}, welcome back to UniSlot.</h2>
            <p className="max-w-2xl text-sm text-slate-200 sm:text-base">
              {subtitleByRole}
            </p>
            {role === "USER" && userEmail ? <p className="text-xs text-blue-100">Signed in as {userEmail}</p> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs tracking-[0.12em] text-slate-200 uppercase">Database Sync</p>
              <div className="mt-1 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-300" />
                <span className="text-sm font-semibold text-white">{loading ? "Loading..." : "Live"}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <p className="text-xs tracking-[0.12em] text-slate-200 uppercase">Pending Alerts</p>
              <div className="mt-1 flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-300" />
                <span className="text-sm font-semibold text-white">{pendingAlerts} items</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 sm:px-5">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <p className="text-sm">{error}</p>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((card) => {
          const Icon = card.icon

          return (
            <article
              key={card.title}
              className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_22px_45px_-34px_rgba(15,23,42,0.55)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{card.title}</p>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{card.value}</p>
              <p className="mt-2 text-xs font-medium text-slate-500 uppercase tracking-[0.12em]">{card.trend}</p>
            </article>
          )
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Quick Actions</h3>
            <span className="text-xs text-slate-500 uppercase tracking-[0.12em]">Role-based access</span>
          </div>

          <div className="grid gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon

              return (
                <button
                  key={action.path}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className={`group flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r px-4 py-4 text-left text-white shadow-[0_18px_38px_-24px_rgba(15,23,42,0.75)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 ${action.className}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{action.label}</p>
                      <p className="mt-0.5 text-xs text-white/80">{action.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 opacity-80 transition-transform group-hover:translate-x-0.5" />
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.45)] sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <Ticket className="h-4 w-4 text-slate-400" />
          </div>

          {loading ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading real-time dashboard activity...
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No activity records available yet for this role.
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <article key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-sm font-medium text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.note}</p>
                  <p className="mt-2 text-[11px] font-medium tracking-[0.1em] text-slate-500 uppercase">{item.time}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-slate-50 px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {role === "ADMIN"
              ? "You are viewing organization-wide data from all users and resources."
              : role === "USER"
                ? `You are viewing bookings linked to your account${userId ? ` (${userId})` : ""}.`
                : "Use this workspace to monitor technical operations and resource readiness."}
          </p>
          <button
            type="button"
            onClick={() => navigate(role === "ADMIN" ? "/admin/bookings" : "/my-bookings")}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
          >
            {role === "ADMIN" ? "Open All Bookings" : "Open My Bookings"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  )
}

function ComingSoon({ title }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
      <h2 className="mb-2 text-2xl font-semibold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500">Coming soon...</p>
    </div>
  )
}

function RoleRoute({ allowedRoles, children }) {
  const role = (localStorage.getItem("role") || "").toUpperCase()

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppShell() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-b from-slate-50 to-indigo-50 text-slate-900">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="border-b border-slate-200/80 bg-white/80 px-6 py-5 backdrop-blur-sm sm:px-8">
            <div className="text-xs tracking-[0.16em] text-slate-600 uppercase">UniSlot</div>
            <h1 className="mt-2 text-3xl leading-tight font-semibold text-slate-900">
              Smart Campus Operations Hub
            </h1>
          </header>

          <main className="flex-1 overflow-y-auto p-6 sm:p-8">
            <div className="mx-auto grid w-full max-w-6xl gap-6">
              <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_50px_-24px_rgba(15,23,42,0.22)] sm:p-7">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
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
                    path="/resources"
                    element={
                      <RoleRoute allowedRoles={["ADMIN", "TECHNICIAN"]}>
                        <AdminResourcesInterface />
                      </RoleRoute>
                    }
                  />
                  <Route path="/tickets" element={<CreateTicketPage />} />
                  <Route path="/notifications" element={<ComingSoon title="Notifications" />} />
                  <Route path="/profile" element={<ComingSoon title="My Profile" />} />
                  <Route path="/invoices" element={<ComingSoon title="Invoices" />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </section>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

function App() {
  const token = localStorage.getItem("token")

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/signup" element={token ? <Navigate to="/" replace /> : <SignupPage />} />
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
  )
}

export default App
