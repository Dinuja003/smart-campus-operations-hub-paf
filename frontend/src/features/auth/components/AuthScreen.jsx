import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, Building2, CalendarCheck2, Lock, Mail, Sparkles, Ticket, TrendingUp, User, Wrench } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { persistAuth, signIn, signUp } from "@/features/auth/services/authService"

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 48 48" fill="none">
      <path d="M44.5 20H24V28.5H35.8C34.1 33.5 29.4 36.8 24 36.8C16.8 36.8 11 31 11 23.8C11 16.6 16.8 10.8 24 10.8C27.3 10.8 30.2 12 32.4 14L38.4 8C34.7 4.6 29.6 2.5 24 2.5C12.1 2.5 2.5 12.1 2.5 24C2.5 35.9 12.1 45.5 24 45.5C35.9 45.5 45 36.9 45 24.7C45 23 44.8 21.4 44.5 20Z" fill="#FFC107" />
      <path d="M6.4 14.1L13.4 19.2C15.3 14.4 19.3 10.8 24 10.8C27.3 10.8 30.2 12 32.4 14L38.4 8C34.7 4.6 29.6 2.5 24 2.5C16 2.5 9.1 7.1 6.4 14.1Z" fill="#FF3D00" />
      <path d="M24 45.5C29.5 45.5 34.5 43.6 38.1 40.4L31.5 35C29.4 36.6 26.8 37.5 24 37.5C18.8 37.5 14.2 34.2 12.4 29.4L5.5 34.7C8.2 41 15.5 45.5 24 45.5Z" fill="#4CAF50" />
      <path d="M44.5 20H24V28.5H35.8C35 30.8 33.5 32.9 31.4 34.4L31.4 34.4L38 39.8C37.5 40.2 45 34.5 45 24.7C45 23 44.8 21.4 44.5 20Z" fill="#1976D2" />
    </svg>
  )
}

const features = [
  { icon: CalendarCheck2, label: "Smart Bookings" },
  { icon: Wrench,         label: "Resources"      },
  { icon: Ticket,         label: "Ticketing"      },
  { icon: TrendingUp,     label: "Analytics"      },
]

export default function AuthScreen({ initialMode = "login" }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" })

  const isLogin = mode === "login"
  const backendOrigin = import.meta.env.VITE_BACKEND_ORIGIN || "http://localhost:8081"

  const topError = useMemo(() => {
    if (searchParams.get("error") === "google_auth_failed") {
      return "Google authentication failed. Please try again."
    }
    return ""
  }, [searchParams])

  const submit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password }
      const data = isLogin ? await signIn(payload) : await signUp(payload)
      persistAuth(data)
      navigate("/", { replace: true })
    } catch (err) {
      setError(err?.response?.data?.message || err?.response?.data?.error || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  const toggle = (nextMode) => {
    setMode(nextMode)
    navigate(nextMode === "login" ? "/login" : "/signup", { replace: true })
    setError("")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#001d45] px-4 py-8">

      {/* ── Card ── */}
      <div className="relative w-full max-w-[940px] overflow-hidden rounded-[28px] shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
        <div className="relative flex min-h-[680px] lg:min-h-[580px]">

          {/* ── Left panel (navy, orange accents) ── */}
          <aside
            className={cn(
              "hidden lg:flex absolute inset-y-0 w-1/2 flex-col justify-between overflow-hidden bg-[#001d45] border-r border-white/10 p-10 text-white transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isLogin ? "translate-x-full" : "translate-x-0"
            )}
          >
            {/* Subtle decorative shapes */}
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#f45e2b]/8" />
            <div className="pointer-events-none absolute -left-10 bottom-10 h-40 w-40 rounded-full bg-[#f45e2b]/5" />
            <div className="pointer-events-none absolute right-10 top-1/2 h-2.5 w-2.5 rounded-full bg-[#f45e2b]/50" />
            <div className="pointer-events-none absolute left-16 top-1/3 h-1.5 w-1.5 rounded-full bg-[#f45e2b]/35" />
            <div className="pointer-events-none absolute right-24 bottom-32 h-2 w-2 rounded-full bg-white/20" />

            {/* Brand + tagline */}
            <div className="relative space-y-7">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f45e2b] shadow-[0_6px_20px_rgba(244,94,43,0.45)]">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-extrabold tracking-tight text-white">UniSlot</span>
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f45e2b]/30 bg-[#f45e2b]/10 px-3 py-1.5 text-[11px] font-medium tracking-widest uppercase text-[#f45e2b]">
                  <Sparkles className="h-3 w-3" />
                  Smart Campus Auth
                </div>
                <h2 className="max-w-xs text-[1.85rem] font-bold leading-snug text-white" style={{ margin: 0 }}>
                  {isLogin
                    ? "Welcome back to your campus hub."
                    : "Join the smart campus network."}
                </h2>
                <p className="max-w-xs text-sm leading-relaxed text-white/55">
                  {isLogin
                    ? "Manage bookings, facilities and operations — all from one unified workspace."
                    : "Create your account and unlock resources, bookings, tickets and analytics."}
                </p>
              </div>

              {/* Feature tags */}
              <div className="flex flex-wrap gap-2">
                {features.map(({ icon: Icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/55"
                  >
                    <Icon className="h-3 w-3 text-[#f45e2b]" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Status card */}
            <div className="relative rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f45e2b]" />
                <p className="text-[10px] font-semibold tracking-widest text-white/40 uppercase">Campus Status</p>
              </div>
              <p className="text-base font-semibold text-white">All Systems Online</p>
              <p className="mt-0.5 text-xs text-white/45">Auth, booking sync and facility updates are healthy.</p>
            </div>
          </aside>

          {/* ── Right panel (white form) ── */}
          <div
            className={cn(
              "relative w-full bg-white px-6 py-8 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-9 lg:w-1/2 lg:px-10 lg:py-9",
              isLogin ? "lg:translate-x-0" : "lg:translate-x-full"
            )}
          >
            <div className="mx-auto w-full max-w-md space-y-5">

              {/* Logo — mobile only */}
              <div className="flex items-center gap-2 lg:hidden">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f45e2b]">
                  <Building2 className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-base font-extrabold text-[#001d45]">UniSlot</span>
              </div>

              {/* Tab switcher */}
              <div className="space-y-4">
                <div className="relative inline-grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <span
                    className={cn(
                      "pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-[#001d45] shadow-[0_4px_14px_rgba(0,29,69,0.25)] transition-transform duration-300",
                      isLogin ? "translate-x-0" : "translate-x-full"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => toggle("login")}
                    className={cn(
                      "relative z-10 rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                      isLogin ? "text-white" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle("signup")}
                    className={cn(
                      "relative z-10 rounded-lg px-5 py-2 text-sm font-semibold transition-colors",
                      isLogin ? "text-slate-500 hover:text-slate-700" : "text-white"
                    )}
                  >
                    Sign Up
                  </button>
                </div>

                <div className="space-y-1">
                  <h3 className="text-[1.6rem] font-bold leading-tight text-[#001d45]" style={{ margin: 0 }}>
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {isLogin
                      ? "Sign in with your email and password."
                      : "Register with your email and a secure password."}
                  </p>
                </div>
              </div>

              {(topError || error) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {topError || error}
                </div>
              )}

              <form className="space-y-3.5" onSubmit={submit}>
                {!isLogin && (
                  <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-[#001d45]/60" htmlFor="first-name">
                        First Name
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="first-name"
                          required
                          value={form.firstName}
                          onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                          placeholder="First name"
                          className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus-visible:border-[#f45e2b]/60 focus-visible:ring-[#f45e2b]/20"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-widest text-[#001d45]/60" htmlFor="last-name">
                        Last Name
                      </label>
                      <div className="relative">
                        <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="last-name"
                          required
                          value={form.lastName}
                          onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                          placeholder="Last name"
                          className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus-visible:border-[#f45e2b]/60 focus-visible:ring-[#f45e2b]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#001d45]/60" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="you@campus.edu"
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus-visible:border-[#f45e2b]/60 focus-visible:ring-[#f45e2b]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-widest text-[#001d45]/60" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder={isLogin ? "Enter your password" : "Create a secure password"}
                      className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus-visible:border-[#f45e2b]/60 focus-visible:ring-[#f45e2b]/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-xl bg-[#f45e2b] text-sm font-semibold text-white shadow-[0_8px_24px_rgba(244,94,43,0.35)] hover:bg-[#e04d1e] disabled:opacity-60"
                >
                  {loading ? "Please wait…" : isLogin ? "Sign In" : "Create Account"}
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </Button>
              </form>

              <div className="space-y-3.5">
                <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  or continue with
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { window.location.href = `${backendOrigin}/oauth2/authorization/google` }}
                  className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-[#001d45]/20"
                >
                  <GoogleMark />
                  {isLogin ? "Sign in with Google" : "Sign up with Google"}
                </Button>
              </div>

              {/* Mobile toggle hint */}
              <p className="text-center text-xs text-slate-400 lg:hidden">
                {isLogin ? "No account?" : "Already registered?"}{" "}
                <button
                  type="button"
                  onClick={() => toggle(isLogin ? "signup" : "login")}
                  className="font-semibold text-[#f45e2b] hover:underline"
                >
                  {isLogin ? "Sign up free" : "Sign in"}
                </button>
              </p>
            </div>
          </div>

          {/* Mobile bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-[#001d45] px-6 py-4 text-white lg:hidden">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f45e2b]" />
              <p className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Smart Campus Operations Hub</p>
            </div>
            <p className="mt-1 text-xs text-white/40">
              {isLogin
                ? "Need an account? Switch to Sign Up above."
                : "Already registered? Switch to Sign In above."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
