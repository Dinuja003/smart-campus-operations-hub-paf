import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { persistAuth } from "@/features/auth/services/authService"
import { roleToDashboard } from "@/features/auth/utils/redirectByRole"
import { useUserProfile } from "@/features/users/context/UserProfileContext"

export default function OAuth2CallbackPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { refreshProfile } = useUserProfile()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get("token")
    const role = params.get("role")
    const redirectTo = params.get("redirectTo")

    if (!token || !role) {
      navigate("/login?error=google_auth_failed", { replace: true })
      return
    }

    persistAuth({
      token,
      role,
      userId: params.get("userId") || "",
      email: params.get("email") || "",
    })
    refreshProfile().finally(() => navigate("/", { replace: true }))
  }, [location.search, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-700">
      Completing Google sign-in...
    </div>
  )
}
