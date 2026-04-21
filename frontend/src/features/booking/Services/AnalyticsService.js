import axios from "axios"

const API = axios.create({ baseURL: "/api" })

API.interceptors.request.use(config => {
  const token = sessionStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const analyticsService = {
  getAnalyticsOverview: () => API.get("/bookings/analytics/overview").then(response => response.data),
}

export default analyticsService
