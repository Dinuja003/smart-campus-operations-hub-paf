import { Navigate } from "react-router-dom"
import { clearAuth, isTokenExpired } from "../services/authService"

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = sessionStorage.getItem("token")
  const role = (sessionStorage.getItem("role") || "").toUpperCase()

  // Authorization: block when token is missing/expired and reset stale session state.
  if (!token || isTokenExpired(token)) {
    clearAuth()
    return <Navigate to="/" replace />
  }
  // Authorization: enforce per-route role access with a safe fallback to public entry.
  if (!allowedRoles.includes(role)) {
    clearAuth()
    return <Navigate to="/" replace />
  }
  return children
}
