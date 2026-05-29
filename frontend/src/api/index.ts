import client from './client'
import type {
  AuthResponse, User, Attendance,
  MonitorData, AdminStats, AnalyticsData,
  Setting, FaceDescriptor, AttendanceResult,
} from '@/types'

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    client.post<AuthResponse>('/api/auth/login/', { username, password }),

  register: (data: Record<string, unknown>) =>
    client.post('/api/auth/register/', data),

  logout: (refresh: string) =>
    client.post('/api/auth/logout/', { refresh }),

  me: () =>
    client.get<User>('/api/auth/me/'),

  updateMe: (data: Partial<User>) =>
    client.patch<User>('/api/auth/me/', data),

  changePassword: (old_password: string, new_password: string) =>
    client.post('/api/auth/change-password/', { old_password, new_password }),

  getFaceDescriptors: () =>
    client.get<FaceDescriptor[]>('/api/auth/face-descriptors/'),

  saveFace: (user_id: number, face_descriptors: number[][]) =>
    client.post('/api/auth/save-face/', { user_id, face_descriptors }),

  getTasks: () =>
    client.get<import('@/types').Task[]>('/api/auth/me/tasks/'),

  updateTask: (id: number, is_completed: boolean) =>
    client.patch(`/api/auth/me/tasks/${id}/`, { is_completed }),
}

// ── Users (Admin) ─────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, string>) =>
    client.get<{ results: User[]; count: number }>('/api/users/', { params }),

  detail: (id: number) =>
    client.get<User>(`/api/users/${id}/`),

  update: (id: number, data: Partial<User>) =>
    client.patch<User>(`/api/users/${id}/`, data),

  delete: (id: number) =>
    client.delete(`/api/users/${id}/`),

  approve: (id: number) =>
    client.post<{ message: string; user: User }>(`/api/users/${id}/approve/`),

  ban: (id: number) =>
    client.post<{ message: string }>(`/api/users/${id}/ban/`),

  stats: () =>
    client.get<AdminStats>('/api/users/stats/'),

  logs: () =>
    client.get('/api/users/logs/'),
}

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceApi = {
  getChallenge: () =>
    client.get<{ challenge: string }>('/api/attendance/challenge/'),

  faceCheckin: (user_id: number, lat: number, lng: number, challenge: string) =>
    client.post<AttendanceResult>('/api/attendance/face/', { user_id, lat, lng, challenge }),

  qrCheckin: (qr_token: string, lat: number, lng: number) =>
    client.post<AttendanceResult>('/api/attendance/qr/', { qr_token, lat, lng }),

  list: (params?: Record<string, string>) =>
    client.get<{ results: Attendance[]; count: number }>('/api/attendance/list/', { params }),

  monitor: () =>
    client.get<MonitorData>('/api/attendance/monitor/'),

  analytics: () =>
    client.get<AnalyticsData>('/api/attendance/analytics/'),

  exportCsv: (date_from: string, date_to: string) =>
    client.get('/api/attendance/export/', {
      params: { date_from, date_to },
      responseType: 'blob',
    }),
}

// ── Settings ──────────────────────────────────────────────────────────────────
export const settingsApi = {
  get: () =>
    client.get<Setting>('/api/settings/'),

  save: (data: Partial<Setting>) =>
    client.post('/api/settings/', data),

  public: () =>
    client.get<Setting>('/api/settings/public/'),
}

// ── AI Service ────────────────────────────────────────────────────────────────
export const aiApi = {
  assistant: (prompt: string) =>
    client.post<{ answer: string }>('/api/ai/assistant/', { prompt }),

  ocr: (image: string) =>
    client.post<{ data: string }>('/api/ai/ocr/', { image }),

  analytics: () =>
    client.get<{ prediction: string }>('/api/ai/analytics/'),
}
