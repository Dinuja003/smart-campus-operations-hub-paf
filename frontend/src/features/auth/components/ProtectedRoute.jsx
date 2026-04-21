import { Navigate } from "react-router-dom"
import { clearAuth, isTokenExpired } from "../services/authService"

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = sessionStorage.getItem("token")
  const role = (sessionStorage.getItem("role") || "").toUpperCase()

  if (!token || isTokenExpired(token)) {
    clearAuth()
    return <Navigate to="/" replace />
  }
  if (!allowedRoles.includes(role)) {
    clearAuth()
    return <Navigate to="/" replace />
  }
  return children
}
