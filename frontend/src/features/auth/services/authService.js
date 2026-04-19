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
  localStorage.setItem("token", data.token)
  localStorage.setItem("role", data.role)
  localStorage.setItem("userId", data.userId)
  localStorage.setItem("email", data.email)
}

export function clearAuth() {
  localStorage.removeItem("token")
  localStorage.removeItem("role")
  localStorage.removeItem("userId")
  localStorage.removeItem("email")
}
