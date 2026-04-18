import axios from "axios"

const API = axios.create({ baseURL: "/api" })

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const resourceService = {
  getAllResources: () => API.get("/resources").then((response) => response.data),
  getResourceById: (id) => API.get(`/resources/${id}`).then((response) => response.data),
}

export default resourceService
