import axios from "axios"

const authApi = axios.create({
  baseURL: "/api/auth",
})

// Auth Flow: local login request -> backend returns JWT + user identity payload.
export async function signIn(payload) {
  const { data } = await authApi.post("/login", payload)
  return data
}

// Auth Flow: local signup request -> backend creates user and returns JWT response.
export async function signUp(payload) {
  const { data } = await authApi.post("/signup", payload)
  return data
}

// Auth Flow: stores auth session in browser storage for route guards and API headers.
export function persistAuth(data) {
  if (!data?.token) return
  sessionStorage.setItem("token", data.token)
  sessionStorage.setItem("role", data.role)
  sessionStorage.setItem("userId", data.userId)
  sessionStorage.setItem("email", data.email)
}

// Security: central cleanup used on logout, unauthorized responses, and guard failures.
export function clearAuth() {
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("role")
  sessionStorage.removeItem("userId")
  sessionStorage.removeItem("email")
}

// Security: frontend-side expiry check to avoid using stale JWTs.
export function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

// Security: global 401 handling keeps client state aligned with server auth decisions.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      window.location.replace("/")
    }
    return Promise.reject(error)
  }
)
