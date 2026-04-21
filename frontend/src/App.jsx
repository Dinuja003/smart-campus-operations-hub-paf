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
import bookingService from "./features/booking/Services/BookingService"
import resourceService from "./features/resources/services/resourceService"
import AdminResourcesInterface from "./features/resources/AdminResourcesInterface.jsx"
import CreateTicketPage from "./features/ticket/pages/CreateTicketPage"
import AnalyticsPage from "./features/booking/pages/AnalyticsPage"
import UserManagementPage from "./features/users/pages/UserManagementPage.jsx"

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
      path: "/tickets",
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
  const [bannerSlide, setBannerSlide] = useState(0)

  const bannerImages = [
    "https://images.unsplash.com/photo-1562774053-701939374585?w=1400&q=80&fit=crop",
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1400&q=80&fit=crop",
    "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1400&q=80&fit=crop",
  ]

  useEffect(() => {
    const t = window.setInterval(() => setBannerSlide((s) => (s + 1) % bannerImages.length), 4000)
    return () => window.clearInterval(t)
  }, [bannerImages.length])

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

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

  const tableRowIconStyles = [
    "bg-brand/10 text-brand",
    "bg-[#f5b800]/15 text-[#b08800]",
    "bg-emerald-100 text-emerald-700",
    "bg-orange-100 text-orange-700",
    "bg-brand/10 text-brand",
  ]

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

  // Calendar computed values
  const calYear = calendarMonth.getFullYear()
  const calMonthIdx = calendarMonth.getMonth()
  const calDaysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate()
  const calStartDay = new Date(calYear, calMonthIdx, 1).getDay()
  const calMonthShort = calendarMonth.toLocaleDateString([], { month: "short" }).toUpperCase()
  const calMonthFull = calendarMonth.toLocaleDateString([], { month: "long", year: "numeric" })
  const todayStr = liveNow.toISOString().split("T")[0]
  const todayCalBookings = recentActivity.filter((b) => b.date === todayStr)
  const prevCalMonth = () => setCalendarMonth(new Date(calYear, calMonthIdx - 1, 1))
  const nextCalMonth = () => setCalendarMonth(new Date(calYear, calMonthIdx + 1, 1))

  return (
    <div className="space-y-4">


      {/* ── Promo Banner ── */}
      <section className="relative overflow-hidden rounded-[26px] shadow-[0_14px_40px_rgba(21,32,85,0.18)] h-[160px] sm:h-[180px]">
        {/* Background images — crossfade */}
        {bannerImages.map((src, idx) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ease-in-out"
            style={{ opacity: idx === bannerSlide ? 1 : 0 }}
          />
        ))}
        {/* Dark overlay on the right to make text readable, fades from transparent on left */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/50 to-[#001d45]/92" />

        {/* Content: left side light, right side text */}
        <div className="relative flex h-full items-center justify-end px-8 sm:px-10">
          <div className="max-w-sm text-right">
            <p className="mb-1 text-[10px] font-bold tracking-widest text-[#f45e2b] uppercase">
              {greeting}
            </p>
            <p className="text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              Need a space?<br />Book it in a tap.
            </p>
            <p className="mt-2 text-sm text-white/65">
              {bookingStats.approved > 0
                ? `You have ${bookingStats.approved} confirmed booking${bookingStats.approved !== 1 ? "s" : ""}`
                : "No confirmed bookings yet"}
              {bookingStats.pending > 0 ? ` and ${bookingStats.pending} pending review.` : "."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Hero + Calendar ── */}
      <div className="grid gap-4 xl:grid-cols-[1.99fr_0.6fr]">

        

        {/* Greeting + metric cards */}
        <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-4 shadow-[0_14px_40px_rgba(21,32,85,0.10)] backdrop-blur-sm sm:p-5">
          <div className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-brand/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[#f5b800]/10 blur-3xl" />

          <div className="relative flex flex-wrap items-start justify-between gap-2">
            <div className="space-y-1">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-brand">
                <Sparkles className="h-3 w-3" />
                Campus Command Center
              </p>
              <h1 className="m-0 text-2xl font-bold leading-tight text-navy sm:text-3xl">
                {greeting}, {displayName}
              </h1>
              <p className="text-xs text-[#5a6b98]">{subtitleByRole}</p>
            </div>
            <div className="rounded-xl border border-brand/15 bg-white/80 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-medium text-[#6c79a3]">{dateLabel}</p>
              <p className="mt-0.5 font-mono text-lg font-semibold tracking-tight text-navy">{clockLabel}</p>
            </div>
          </div>

          <div className="relative mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {metricCards.map((card) => {
              const Icon = card.icon
              return (
                <article key={card.title} className="rounded-2xl border border-white/70 bg-white p-3.5 shadow-[0_4px_16px_rgba(21,32,85,0.06)]">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-[#8494c2] uppercase">{card.title}</p>
                      <p className="mt-1.5 text-2xl font-semibold leading-none text-navy">{loading ? "—" : card.value}</p>
                      <p className="mt-1 text-[11px] text-[#8494c2]">{card.sub}</p>
                    </div>
                    <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
                      <Icon className={`h-3.5 w-3.5 ${card.iconColor}`} />
                    </span>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* Calendar */}
        <section className="rounded-[26px] border border-white/60 bg-white p-4 shadow-[0_14px_40px_rgba(21,32,85,0.10)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-navy">My Calendar</h3>
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold tracking-widest text-brand uppercase">
              {calMonthShort}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs font-medium text-[#3a4b7c]">{calMonthFull}</p>
            <div className="flex gap-0.5">
              <button type="button" onClick={prevCalMonth} className="rounded-md p-1 text-[#8494c2] hover:bg-slate-50 hover:text-navy transition-colors">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={nextCalMonth} className="rounded-md p-1 text-[#8494c2] hover:bg-slate-50 hover:text-navy transition-colors">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="mt-2 grid grid-cols-7">
            {["S","M","T","W","T","F","S"].map((d, i) => (
              <div key={i} className="py-0.5 text-center text-[9px] font-bold tracking-wide text-[#8494c2]">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: calStartDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: calDaysInMonth }, (_, i) => {
              const day = i + 1
              const dateStr = `${calYear}-${String(calMonthIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              const isToday = dateStr === todayStr
              const hasBooking = recentActivity.some((b) => b.date === dateStr)
              return (
                <div key={day} className={`relative flex aspect-square flex-col items-center justify-center rounded-md text-xs transition-colors
                  ${isToday ? "bg-brand font-semibold text-white shadow-sm" : "text-[#3a4b7c] hover:bg-slate-50"}`}>
                  {day}
                  {hasBooking && !isToday && (
                    <span className="absolute bottom-0 h-1 w-1 rounded-full bg-[#f5b800]" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Today's bookings */}
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-1.5 text-[9px] font-bold tracking-widest text-[#8494c2] uppercase">Today&apos;s Bookings</p>
            {loading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin text-brand" /> Loading...
              </div>
            ) : todayCalBookings.length === 0 ? (
              <p className="text-xs text-slate-400">No bookings today</p>
            ) : (
              <div className="space-y-1">
                {todayCalBookings.map((b) => (
                  <div key={b.id} className="flex items-center gap-2 rounded-lg bg-brand/8 px-2.5 py-1.5">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <div>
                      <p className="text-[11px] font-semibold text-brand">{b.title}</p>
                      <p className="text-[10px] text-[#8494c2]">{b.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/my-bookings")}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 py-2 text-xs font-medium text-[#3a4b7c] transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-brand"
          >
            + New Booking
          </button>
        </section>
      </div>


      {/* ── Error ── */}
      {error && (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        </section>
      )}

      {/* ── Bookings Table + Quick Actions ── */}
      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-[26px] border border-white/60 bg-white shadow-[0_18px_50px_rgba(21,32,85,0.10)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h3 className="text-base font-semibold text-navy">Upcoming Operations</h3>
              <p className="mt-0.5 text-xs text-[#8494c2]">Bookings, schedules and occupancy windows</p>
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
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand" />
              Loading bookings...
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="p-5 text-sm text-slate-400">No booking records yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 text-left text-[10px] font-bold tracking-widest text-[#8494c2] uppercase">
                      {role === "ADMIN" ? "Resource / User" : "Resource"}
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold tracking-widest text-[#8494c2] uppercase">Date</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold tracking-widest text-[#8494c2] uppercase">Time</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold tracking-widest text-[#8494c2] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((item, idx) => (
                    <tr key={item.id} className={idx < recentActivity.length - 1 ? "border-b border-slate-50" : ""}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${tableRowIconStyles[idx % tableRowIconStyles.length]}`}>
                            {item.title.slice(0, 2).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-navy">{item.title}</p>
                            {item.owner && <p className="truncate text-xs text-[#8494c2]">{item.owner}</p>}
                            <p className="text-[11px] text-[#a0aec0]">{item.relativeTime}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-[#6677a4]">{item.date}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-[#6677a4]">{item.time}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusColors[item.status] ?? "bg-slate-100 text-slate-600"}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-[26px] border border-white/60 bg-white p-5 shadow-[0_18px_50px_rgba(21,32,85,0.10)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-navy">Smart Shortcuts</h3>
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[9px] font-bold tracking-widest text-brand uppercase">
              {roleLabel}
            </span>
          </div>

          <div className="grid gap-2.5">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <button
                  key={action.path}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/20 hover:bg-brand/5 hover:shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-navy">{action.label}</p>
                      <p className="mt-0.5 text-xs text-[#8494c2]">{action.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#8494c2] transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
                </button>
              )
            })}
          </div>

          {/* Pending summary */}
          <div className="mt-4 rounded-2xl bg-navy p-4 text-white">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-widest text-white/60 uppercase">Pending Alerts</p>
              <Bell className="h-4 w-4 text-[#f5b800]" />
            </div>
            <p className="mt-2 text-3xl font-semibold">{pendingAlerts}</p>
            <p className="mt-0.5 text-xs text-white/50">items awaiting review</p>
            <div className="mt-3 h-1.5 rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[#f5b800] transition-all" style={{ width: `${Math.min(100, pendingAlerts * 10 + 5)}%` }} />
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
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#eef2fb]">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
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
              <Route path="/tickets" element={<CreateTicketPage />} />
              <Route path="/notifications" element={<ComingSoon title="Notifications" />} />
              <Route path="/profile" element={<ComingSoon title="My Profile" />} />
              <Route path="/invoices" element={<ComingSoon title="Invoices" />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}

function App() {
  const token = sessionStorage.getItem("token")

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/signup" element={token ? <Navigate to="/dashboard" replace /> : <SignupPage />} />
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
