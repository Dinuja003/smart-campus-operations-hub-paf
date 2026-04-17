export function roleToDashboard(role) {
  const normalizedRole = String(role || "").toUpperCase()
  if (normalizedRole === "ADMIN") return "/admin/dashboard"
  if (normalizedRole === "TECHNICIAN") return "/technician/dashboard"
  return "/user/dashboard"
}
