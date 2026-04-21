import axios from "axios"

const API = axios.create({ baseURL: "/api" })

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token")
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const userService = {
  getAllUsers:  ()         => API.get("/admin/users").then(r => r.data),
  createUser:  (data)     => API.post("/admin/users", data).then(r => r.data),
  updateUser:  (id, data) => API.put(`/admin/users/${id}`, data).then(r => r.data),
  deleteUser:  (id)       => API.delete(`/admin/users/${id}`).then(r => r.data),
}

export default userService
