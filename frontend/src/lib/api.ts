import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// Auth
export const authApi = {
  register: (data: { name: string; email: string; password: string; city?: string; first_task?: string }) =>
    api.post<{ access_token: string }>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<{ access_token: string }>('/auth/login', data),
  me: () => api.get('/auth/me'),
}

// Entries
export const entriesApi = {
  list: () => api.get('/entries'),
  create: (data: object) => api.post('/entries', data),
  update: (id: string, data: object) => api.put(`/entries/${id}`, data),
  publish: (id: string) => api.post(`/entries/${id}/publish`),
  delete: (id: string) => api.delete(`/entries/${id}`),
  proposals: (id: string) => api.get(`/entries/${id}/proposals`),
}

// Browse
export const browseApi = {
  entries: (params?: object) => api.get('/browse/entries', { params }),
  entry: (id: string) => api.get(`/browse/entries/${id}`),
}

// Proposals
export const proposalsApi = {
  submit: (data: { entry_id: string; price: number; message?: string }) =>
    api.post('/proposals', data),
  withdraw: (id: string) => api.delete(`/proposals/${id}`),
}

// Bookings
export const bookingsApi = {
  accept: (proposalId: string) => api.post('/bookings', null, { params: { proposal_id: proposalId } }),
  complete: (id: string) => api.post(`/bookings/${id}/complete`),
  dispute: (id: string) => api.post(`/bookings/${id}/dispute`),
}

// Projects
export const projectsApi = {
  list: () => api.get('/projects'),
  create: (data: object) => api.post('/projects', data),
  update: (id: string, data: object) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  addTask: (projectId: string, data: { title: string; order?: number }) =>
    api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (projectId: string, taskId: string, data: object) =>
    api.put(`/projects/${projectId}/tasks/${taskId}`, data),
  deleteTask: (projectId: string, taskId: string) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),
  publishTask: (projectId: string, taskId: string) =>
    api.post(`/projects/${projectId}/tasks/${taskId}/publish`),
}

// Profile
export const profileApi = {
  get: (id: string) => api.get(`/profile/${id}`),
  update: (data: object) => api.put('/profile', data),
}

// Messages
export const messagesApi = {
  list: (bookingId: string) => api.get(`/messages/${bookingId}`),
  send: (bookingId: string, content: string) =>
    api.post(`/messages/${bookingId}`, { content }),
}

// AI
export const aiApi = {
  categorize: (text: string, city?: string) =>
    api.post('/ai/categorize', { text, city }),
  estimate: (text: string, city?: string) =>
    api.post('/ai/estimate', { text, city }),
  liveMatch: (text: string, city?: string) =>
    api.post('/ai/live-match', { text, city }),
}
