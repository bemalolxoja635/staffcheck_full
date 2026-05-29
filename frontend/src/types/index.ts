export interface User {
  id: number
  username: string
  firstname: string
  lastname: string
  full_name: string
  phone: string
  role: 'admin' | 'user'
  status: 'pending' | 'active' | 'banned'
  position: string
  birth_date: string | null
  birth_place: string
  avatar: string | null
  telegram_id: string
  qr_token: string | null
  has_face: boolean
  daily_rate: number
  created_at: string
}

export interface Task {
  id: number
  user: number
  title: string
  description: string
  is_completed: boolean
  created_at: string
  deadline: string | null
}

export interface Attendance {
  id: number
  user: number
  user_name: string
  user_position: string
  user_avatar: string | null
  date: string
  check_in: string | null
  check_out: string | null
  att_status: 'on_time' | 'late'
  method: 'faceid' | 'qr'
  created_at: string
}

export interface MonitorData {
  total: number
  present: number
  absent: number
  late: number
  updated_at: string
  attendances: MonitorAttendance[]
}

export interface MonitorAttendance {
  id: number
  name: string
  position: string
  avatar: string | null
  check_in: string | null
  check_out: string | null
  status: 'on_time' | 'late'
  method: 'faceid' | 'qr'
}

export interface AdminStats {
  total_users: number
  active_users: number
  pending_users: number
  today_attendance: number
  late_today: number
  absent_today: number
}

export interface AnalyticsData {
  weekly: { date: string; label: string; count: number }[]
  month_on_time: number
  month_late: number
  month_total: number
  today_present: number
  today_late: number
}

export interface Setting {
  start_time: string
  end_time: string
  late_threshold_minutes: string
  company_name: string
  telegram_bot_token?: string
  admin_telegram_id?: string
}

export interface AuthResponse {
  access: string
  refresh: string
  user: User
}

export interface FaceDescriptor {
  id: number
  firstname: string
  lastname: string
  face_descriptors: number[][]
}

export interface AttendanceResult {
  status: 'success' | 'error'
  type?: 'check_in' | 'check_out'
  message: string
  user?: string
  position?: string
  att_status?: 'on_time' | 'late'
}
