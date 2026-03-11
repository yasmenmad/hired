import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          err.config.headers.Authorization = `Bearer ${data.access_token}`
          return api(err.config)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

// ─── AUTH ─────────────────────────────────────────────────────
export const authApi = {
  register: (d: any) => api.post('/auth/register', d).then(r => r.data),
  login: (d: any) => api.post('/auth/login', d).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
}

// ─── USERS ────────────────────────────────────────────────────
export const userApi = {
  getProfil: () => api.get('/users/me/profil').then(r => r.data),
  updateProfil: (d: any) => api.put('/users/me/profil', d).then(r => r.data),
  updateUser: (d: any) => api.put('/users/me', d).then(r => r.data),
}

// ─── CV ───────────────────────────────────────────────────────
export const cvApi = {
  getAll: () => api.get('/cv').then(r => r.data),
  getOne: (id: string) => api.get(`/cv/${id}`).then(r => r.data),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/cv/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data)
  },
  generate: (questionnaire: any) => api.post('/cv/generate', { questionnaire }).then(r => r.data),
  delete: (id: string) => api.delete(`/cv/${id}`),
}

// ─── JOBS ─────────────────────────────────────────────────────
export const jobsApi = {
  search: (params: any) => api.get('/jobs/search', { params }).then(r => r.data),
  getCompatibility: (offre_id: string, cv_id?: string) =>
    api.post('/jobs/compatibility', { offre_id, cv_id }).then(r => r.data),
  save: (offre_id: string) => api.post(`/jobs/${offre_id}/save`).then(r => r.data),
}

// ─── CANDIDATURES ─────────────────────────────────────────────
export const candidaturesApi = {
  getAll: () => api.get('/candidatures').then(r => r.data),
  create: (d: any) => api.post('/candidatures', d).then(r => r.data),
  update: (id: string, d: any) => api.patch(`/candidatures/${id}`, d).then(r => r.data),
  delete: (id: string) => api.delete(`/candidatures/${id}`),
  export: (format: 'xlsx' | 'csv') => api.get(`/candidatures/export?format=${format}`, { responseType: 'blob' }).then(r => r.data),
}

// ─── INTERVIEW ────────────────────────────────────────────────
export const interviewApi = {
  getAll: () => api.get('/interview').then(r => r.data),
  getOne: (id: string) => api.get(`/interview/${id}`).then(r => r.data),
  start: (d: any) => api.post('/interview/start', d).then(r => r.data),
  end: (id: string) => api.post(`/interview/${id}/end`).then(r => r.data),
}

// ─── NOTIFICATIONS ────────────────────────────────────────────
export const notifApi = {
  getAll: () => api.get('/notifications').then(r => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
}

// ─── ADMIN ────────────────────────────────────────────────────
export const adminApi = {
  getStats: () => api.get('/admin/stats').then(r => r.data),
  getUsers: () => api.get('/admin/users').then(r => r.data),
  banUser: (id: string) => api.post(`/admin/users/${id}/ban`),
  unbanUser: (id: string) => api.post(`/admin/users/${id}/unban`),
  sendNotif: (d: any) => api.post('/admin/notifications', d).then(r => r.data),
}
