import axios from "axios"

const authApi = axios.create({
  baseURL: "/api/auth",
})

export async function signIn(payload) {
  const { data } = await authApi.post("/login", payload)
  return data
}

export async function signUp(payload) {
  const { data } = await authApi.post("/signup", payload)
  return data
}

export function persistAuth(data) {
  if (!data?.token) return
  sessionStorage.setItem("token", data.token)
  sessionStorage.setItem("role", data.role)
  sessionStorage.setItem("userId", data.userId)
  sessionStorage.setItem("email", data.email)
}

export function clearAuth() {
  sessionStorage.removeItem("token")
  sessionStorage.removeItem("role")
  sessionStorage.removeItem("userId")
  sessionStorage.removeItem("email")
}

export function isTokenExpired(token) {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

// Intercept 401 responses globally — clear session and redirect to login
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth()
      window.location.replace("/login")
    }
    return Promise.reject(error)
  }
)
