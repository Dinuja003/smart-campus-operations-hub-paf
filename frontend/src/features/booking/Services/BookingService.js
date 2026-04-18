// frontend/src/features/booking/services/bookingService.js
import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach JWT token from localStorage on every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const bookingService = {
  /** POST /api/bookings — create a new booking request */
  createBooking: (data) => API.post('/bookings', data).then(r => r.data),

  /** PUT /api/bookings/:id — edit a pending booking */
  updateBooking: (id, data) => API.put(`/bookings/${id}`, data).then(r => r.data),

  /** GET /api/bookings/my — current user's bookings */
  getMyBookings: () => API.get('/bookings/my').then(r => r.data),

  /** GET /api/bookings/:id — single booking detail */
  getBookingById: (id) => API.get(`/bookings/${id}`).then(r => r.data),

  /** GET /api/bookings?status= — all bookings (admin) */
  getAllBookings: (status) =>
    API.get('/bookings', { params: status ? { status } : {} }).then(r => r.data),

  /** GET /api/bookings/schedule?resourceId=&date= */
  getSchedule: (resourceId, date) =>
    API.get('/bookings/schedule', { params: { resourceId, date } }).then(r => r.data),

  /** PUT /api/bookings/:id/review — admin approve/reject */
  reviewBooking: (id, payload) =>
    API.put(`/bookings/${id}/review`, payload).then(r => r.data),

  /** PATCH /api/bookings/:id/cancel */
  cancelBooking: (id) => API.patch(`/bookings/${id}/cancel`).then(r => r.data),

  /** DELETE /api/bookings/:id (admin) */
  deleteBooking: (id) => API.delete(`/bookings/${id}`).then(r => r.data),
};

export default bookingService;