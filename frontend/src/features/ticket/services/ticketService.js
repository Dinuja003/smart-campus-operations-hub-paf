import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Attach JWT token from sessionStorage on every request
API.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function createTicket(ticketData, files = []) {
  const formData = new FormData();
  formData.append("ticket", JSON.stringify(ticketData));

  files.forEach((file) => {
    formData.append("files", file);
  });

  const res = await API.post("/tickets", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export async function getUserTickets(userId) {
  const res = await API.get(`/tickets/user/${userId}`);
  return res.data;
}

export async function getTicketById(id) {
  const res = await API.get(`/tickets/${id}`);
  return res.data;
}

export async function updateTicket(ticketId, payload) {
  const res = await API.patch(`/tickets/${ticketId}`, payload);
  return res.data;
}

export async function updateTicketStatus(ticketId, status) {
  const res = await API.patch(`/tickets/${ticketId}/status?status=${status}`);
  return res.data;
}

export async function getAllTickets() {
  const res = await API.get("/tickets");
  return res.data;
}

export async function addTicketMessage(ticketId, message) {
  const res = await API.post(`/tickets/${ticketId}/messages`, message);
  return res.data;
}

export async function deleteTicketMessage(ticketId, messageId) {
  const res = await API.delete(`/tickets/${ticketId}/messages/${messageId}`);
  return res.data;
}

export async function deleteTicket(ticketId) {
  await API.delete(`/tickets/${ticketId}`);
}

export async function getTechnicians() {
  const res = await API.get("/tickets/technicians");
  return res.data;
}

export async function assignTechnician(ticketId, technicianId) {
  const res = await API.put(`/tickets/${ticketId}/assign?technicianId=${technicianId}`);
  return res.data;
}
