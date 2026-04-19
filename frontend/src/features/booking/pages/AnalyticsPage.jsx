import { useEffect, useMemo, useState } from "react"
import { AlertCircle, BarChart3, Clock3, Loader2, TrendingUp, Users } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import analyticsService from "../Services/AnalyticsService"

const PIE_COLORS = ["oklch(62.667%_0.14048_250.176)", "#10b981", "#f5b800", "#ef4444", "#152055", "#06b6d4"]
  .map((c, i) => ["#5578d2", "#10b981", "#f5b800", "#ef4444", "#152055", "#06b6d4"][i])

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true

    async function loadAnalytics() {
      setLoading(true)
      setError("")

      try {
        const payload = await analyticsService.getAnalyticsOverview()
        if (!active) return
        setAnalytics(payload)
      } catch (requestError) {
        if (!active) return

        const status = requestError?.response?.status
        if (status === 401) {
          setError("Unauthorized. Please sign in again.")
        } else if (status === 403) {
          setError("Access denied. Only ADMIN users can view analytics.")
        } else {
          setError(
            requestError?.response?.data?.message ||
              requestError?.response?.data ||
              requestError?.message ||
              "Failed to load analytics."
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadAnalytics()
    return () => {
      active = false
    }
  }, [])

  const statusRows = useMemo(() => {
    const source = analytics?.bookingsByStatus || {}
    return Object.entries(source)
      .map(([status, value]) => ({ status, value: Number(value || 0) }))
      .sort((a, b) => b.value - a.value)
  }, [analytics])

  const statusChartData = useMemo(() => {
    return statusRows.map(item => ({ name: item.status, value: item.value }))
  }, [statusRows])

  const maxHourlyCount = useMemo(() => {
    if (!analytics?.hourlyDistribution?.length) return 0
    return Math.max(...analytics.hourlyDistribution.map(point => Number(point.count || 0)))
  }, [analytics])

  const hourlyChartData = useMemo(() => {
    return (analytics?.hourlyDistribution || []).map(point => ({
      hour: `${String(point.hour).padStart(2, "0")}:00`,
      count: Number(point.count || 0),
    }))
  }, [analytics])

  const dailyTrendData = useMemo(() => {
    return (analytics?.dailyTrend || []).map(item => ({
      date: item.date,
      count: Number(item.count || 0),
    }))
  }, [analytics])

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-[26px] border border-white/60 bg-white p-8 text-sm text-[#8494c2] shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
        <Loader2 className="h-4 w-4 animate-spin text-brand" /> Loading booking analytics…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
      </div>
    )
  }

  const statCards = [
    { label: "Total Bookings", value: analytics?.totalBookings || 0, icon: BarChart3, iconBg: "bg-brand", sub: "All time" },
    { label: "Unique Bookers", value: analytics?.uniqueBookers || 0, icon: Users, iconBg: "bg-emerald-500", sub: "Distinct users" },
    { label: "Avg Duration", value: `${analytics?.averageBookingDurationHours || 0}h`, icon: Clock3, iconBg: "bg-[#f5b800]", sub: "Per booking" },
    { label: "Peak Hour", value: maxHourlyCount, icon: TrendingUp, iconBg: "bg-[#152055]", sub: "Max bookings/hr" },
  ]

  return (
    <div className="space-y-5">

      {/* Header */}
      <section className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/80 p-5 shadow-[0_14px_40px_rgba(21,32,85,0.10)] backdrop-blur-sm sm:p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand/8 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-0.5 text-[10px] font-semibold tracking-wide text-brand">
            <BarChart3 className="h-3 w-3" /> Analytics
          </p>
          <h1 className="mt-1.5 text-2xl font-bold text-navy sm:text-3xl">Booking Analytics</h1>
          <p className="mt-0.5 text-sm text-[#5a6b98]">Understand booking demand, peak hours and resource utilization.</p>
        </div>
      </section>

      {/* Stat cards */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, iconBg, sub }) => (
          <article key={label} className="rounded-[22px] border border-white/60 bg-white p-4 shadow-[0_8px_30px_rgba(21,32,85,0.07)]">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#8494c2]">{label}</p>
                <p className="mt-1.5 text-2xl font-bold text-navy">{value}</p>
                <p className="mt-0.5 text-[11px] text-[#8494c2]">{sub}</p>
              </div>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
                <Icon className="h-3.5 w-3.5 text-white" />
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* Charts row 1 */}
      <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-[26px] border border-white/60 bg-white p-5 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
          <h3 className="text-sm font-bold text-navy">Peak Hours</h3>
          <p className="mt-0.5 text-xs text-[#8494c2]">Bookings by start time.</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#8494c2" }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8494c2" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="count" name="Bookings" fill="#5578d2" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[26px] border border-white/60 bg-white p-5 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
          <h3 className="text-sm font-bold text-navy">Booking Status</h3>
          <p className="mt-0.5 text-xs text-[#8494c2]">Distribution across workflow states.</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={90} paddingAngle={3}>
                  {statusChartData.map((entry, i) => <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      {/* Charts row 2 */}
      <section className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[26px] border border-white/60 bg-white p-5 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
          <h3 className="text-sm font-bold text-navy">Top Resources</h3>
          <p className="mt-0.5 text-xs text-[#8494c2]">Most frequently booked resources.</p>
          <div className="mt-4 space-y-2.5">
            {(analytics?.topResources || []).map((r, i) => (
              <div key={r.resourceId} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-[10px] font-bold text-brand">{i + 1}</span>
                  <div>
                    <p className="text-xs font-semibold text-navy">{r.resourceName}</p>
                    <p className="text-[10px] text-[#8494c2]">{r.resourceId?.slice(0, 16)}…</p>
                  </div>
                </div>
                <span className="rounded-lg bg-brand/10 px-2.5 py-1 text-xs font-bold text-brand">{r.bookingCount}</span>
              </div>
            ))}
            {!(analytics?.topResources?.length) && <p className="text-xs text-[#8494c2]">No resource data yet.</p>}
          </div>
        </article>

        <article className="rounded-[26px] border border-white/60 bg-white p-5 shadow-[0_14px_40px_rgba(21,32,85,0.08)]">
          <h3 className="text-sm font-bold text-navy">Daily Trend</h3>
          <p className="mt-0.5 text-xs text-[#8494c2]">Recent bookings by date.</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2fb" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#8494c2" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#8494c2" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="count" name="Bookings" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  )
}
