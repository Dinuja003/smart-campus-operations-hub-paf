import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, Lock, Mail, Sparkles, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { persistAuth, signIn, signUp } from "@/features/auth/services/authService"
import { roleToDashboard } from "@/features/auth/utils/redirectByRole"

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

export default function AuthScreen({ initialMode = "login" }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

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
        : {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            password: form.password,
          }

      const data = isLogin ? await signIn(payload) : await signUp(payload)
      persistAuth(data)
      navigate(data?.redirectTo || roleToDashboard(data?.role), { replace: true })
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
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_16%_10%,#dbeafe_0,#eff6ff_32%,#f8fafc_72%)] px-4 py-8">
      <div className="relative w-full max-w-[940px] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_40px_110px_-50px_rgba(15,23,42,0.6)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-[-92px] h-64 w-64 rounded-full bg-blue-200/55 blur-3xl" />
          <div className="absolute -right-16 bottom-[-84px] h-64 w-64 rounded-full bg-blue-300/50 blur-3xl" />
        </div>

        <div className="relative z-10 min-h-[680px] lg:h-[560px]">
          <aside
            className={cn(
              "hidden lg:flex absolute inset-y-0 w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 p-9 text-white transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isLogin ? "translate-x-full" : "translate-x-0"
            )}>
            <div className="absolute -left-24 -top-20 h-60 w-60 rounded-full border border-white/20 bg-white/10" />
            <div className="absolute -bottom-36 right-[-70px] h-80 w-80 rounded-full border border-white/20 bg-cyan-300/20" />

            <div className="relative space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-xs tracking-[0.16em] uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                UniSlot Auth
              </div>
              <h3 className="max-w-sm text-4xl leading-tight font-semibold text-white">
                {isLogin ? "Secure access for every smart-campus workflow." : "Start your smart-campus experience in seconds."}
              </h3>
              <p className="max-w-sm text-sm text-blue-50/90">
                {isLogin ? "Sign in to manage bookings, facilities, and notifications from one operational hub." : "Create your account and unlock bookings, service requests, and collaboration tools."}
              </p>
            </div>

            <div className="relative rounded-2xl border border-white/25 bg-white/10 px-5 py-4 backdrop-blur-md">
              <p className="text-xs tracking-[0.12em] text-blue-100 uppercase">Campus Status</p>
              <p className="mt-2 text-2xl font-semibold">All Systems Online</p>
              <p className="mt-1 text-sm text-blue-100/90">Authentication, booking sync, and facility updates are healthy.</p>
            </div>
          </aside>

          <div
            className={cn(
              "relative w-full px-6 py-6 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-9 lg:w-1/2 lg:px-10 lg:py-8",
              isLogin ? "lg:translate-x-0" : "lg:translate-x-full"
            )}>
            <div className="mx-auto w-full max-w-md space-y-5">
              <div className="space-y-4">
                <div className="relative inline-grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                  <span
                    className={cn(
                      "pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-white shadow-[0_10px_26px_-15px_rgba(15,23,42,0.7)] transition-transform duration-300",
                      isLogin ? "translate-x-0" : "translate-x-full"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => toggle("login")}
                    className={cn(
                      "relative z-10 rounded-lg px-5 py-2 text-sm font-medium transition-colors",
                      isLogin ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                    )}>
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle("signup")}
                    className={cn(
                      "relative z-10 rounded-lg px-5 py-2 text-sm font-medium transition-colors",
                      isLogin ? "text-slate-500 hover:text-slate-700" : "text-slate-900"
                    )}>
                    Sign Up
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-[29px] leading-tight font-semibold text-slate-900">
                    {isLogin ? "Welcome Back" : "Create Account"}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {isLogin ? "Sign in with your email and password." : "Register with email and set a secure password."}
                  </p>
                </div>
              </div>

              {(topError || error) && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {topError || error}
                </div>
              )}

              <form className="space-y-4" onSubmit={submit}>
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="first-name">First Name</label>
                        <div className="relative">
                          <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input id="first-name" required value={form.firstName} onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))} placeholder="First name" className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus-visible:ring-blue-400/35" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700" htmlFor="last-name">Last Name</label>
                        <div className="relative">
                          <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input id="last-name" required value={form.lastName} onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))} placeholder="Last name" className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus-visible:ring-blue-400/35" />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="email" type="email" required value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="you@campus.edu" className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus-visible:ring-blue-400/35" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700" htmlFor="password">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))} placeholder={isLogin ? "Enter your password" : "Create a secure password"} className="h-11 rounded-xl border-slate-200 bg-slate-50 pl-10 text-sm shadow-none focus-visible:ring-blue-400/35" />
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-gradient-to-r from-blue-700 to-blue-500 text-sm font-semibold text-white shadow-[0_14px_36px_-18px_rgba(37,99,235,0.8)] hover:from-blue-600 hover:to-blue-500">
                  {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-slate-400">
                  <span className="h-px flex-1 bg-slate-200" />
                  or continue with
                  <span className="h-px flex-1 bg-slate-200" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { window.location.href = `${backendOrigin}/oauth2/authorization/google` }}
                  className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50">
                  <GoogleMark />
                  {isLogin ? "Sign in with Google" : "Sign up with Google"}
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:hidden border-t border-slate-200 bg-gradient-to-r from-blue-700 to-blue-500 px-6 py-5 text-white sm:px-10">
            <p className="text-xs tracking-[0.14em] uppercase text-blue-100">Smart Campus Operations Hub</p>
            <p className="mt-1 text-sm text-blue-50">
              {isLogin ? "Need an account? Switch to Sign Up above and start in minutes." : "Already registered? Switch to Sign In above to continue."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
