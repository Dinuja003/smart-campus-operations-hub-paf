import axios from 'axios'

const API = axios.create({ baseURL: '/api' })

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const notificationService = {
  getAll: () => API.get('/notifications').then(r => r.data),
  getUnreadCount: () => API.get('/notifications/unread-count').then(r => r.data.count),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllRead: () => API.patch('/notifications/read-all'),
}

export default notificationService
