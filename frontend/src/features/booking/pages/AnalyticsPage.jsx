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

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

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
      <div className="rounded-2xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading booking analytics...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-2xl font-semibold text-slate-900">Booking Analytics</h2>
        <p className="mt-1 text-sm text-slate-500">Understand booking demand, peak hours and resource utilization.</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Total Bookings</p>
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{analytics?.totalBookings || 0}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Unique Bookers</p>
            <Users className="h-5 w-5 text-teal-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{analytics?.uniqueBookers || 0}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Avg Duration</p>
            <Clock3 className="h-5 w-5 text-amber-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{analytics?.averageBookingDurationHours || 0}h</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-600">Peak Hour Bookings</p>
            <TrendingUp className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{maxHourlyCount}</p>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Peak Hours</h3>
          <p className="mt-1 text-sm text-slate-500">Bookings by start time.</p>

          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} interval={2} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Bookings" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Booking Status</h3>
          <p className="mt-1 text-sm text-slate-500">Distribution across workflow states.</p>

          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={96}
                  paddingAngle={3}
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Top Resources</h3>
          <p className="mt-1 text-sm text-slate-500">Most frequently booked resources.</p>

          <div className="mt-5 space-y-3">
            {(analytics?.topResources || []).map(resource => (
              <div key={resource.resourceId} className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{resource.resourceName}</p>
                  <p className="text-xs text-slate-500">{resource.resourceId}</p>
                </div>
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {resource.bookingCount}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-slate-900">Daily Trend</h3>
          <p className="mt-1 text-sm text-slate-500">Recent bookings by date.</p>

          <div className="mt-5 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Bookings"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>
    </div>
  )
}
