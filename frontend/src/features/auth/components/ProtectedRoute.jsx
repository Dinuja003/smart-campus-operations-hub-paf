import { Navigate } from "react-router-dom"

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token")
  const role = (localStorage.getItem("role") || "").toUpperCase()

  if (!token) {
    return <Navigate to="/login" replace />
  }
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/login" replace />
  }
  return children
}
