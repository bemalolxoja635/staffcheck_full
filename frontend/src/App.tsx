import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'

// Pages
import Landing     from '@/pages/Landing'
import Login       from '@/pages/Login'
import Register    from '@/pages/Register'
import FaceIDPage  from '@/pages/FaceIDPage'
import ScannerPage from '@/pages/ScannerPage'

// Layouts
import AdminLayout from '@/components/layout/AdminLayout'
import UserLayout  from '@/components/layout/UserLayout'

// Admin pages
import Dashboard from '@/pages/admin/Dashboard'
import Users     from '@/pages/admin/Users'
import {
  AttendancePage, AnalyticsPage, MonitorPage,
  SettingsPage, FaceRegisterPage,
} from '@/pages/admin/pages'

// User pages
import { UserDashboard, UserProfile } from '@/pages/user/pages'

// ── Guards ────────────────────────────────────────────────────────────────────
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role !== 'admin') return <Navigate to="/user" replace />
  return <>{children}</>
}

function RequireUser({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return <>{children}</>
}

export default function App() {
  const { theme } = useThemeStore()

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<Landing />} />
        <Route path="/login"   element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/faceid"  element={<FaceIDPage />} />
        <Route path="/scanner" element={<ScannerPage />} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route index                 element={<Dashboard />} />
          <Route path="users"          element={<Users />} />
          <Route path="users/:id/face" element={<FaceRegisterPage />} />
          <Route path="attendance"     element={<AttendancePage />} />
          <Route path="analytics"      element={<AnalyticsPage />} />
          <Route path="monitor"        element={<MonitorPage />} />
          <Route path="settings"       element={<SettingsPage />} />
        </Route>

        {/* User */}
        <Route path="/user" element={<RequireUser><UserLayout /></RequireUser>}>
          <Route index          element={<UserDashboard />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
