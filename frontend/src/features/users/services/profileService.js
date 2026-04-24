import axios from 'axios'

const API = axios.create({ baseURL: '/api' })

API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const profileService = {
  getProfile: () => API.get('/user/profile').then(r => r.data),
  updateProfile: (data) => API.put('/user/profile', data).then(r => r.data),
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return API.post('/user/profile/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data)
  },
  removeImage: () => API.delete('/user/profile/image').then(r => r.data),
}

export default profileService
