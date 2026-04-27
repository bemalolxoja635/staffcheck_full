import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, User, LogOut, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function UserLayout() {
  const { user, logout, refreshToken } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {}
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold">StaffCheck</span>
          <nav className="flex items-center gap-1 ml-4">
            <NavLink
              to="/user"
              end
              className={({ isActive }) =>
                cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent')
              }
            >
              <Home className="w-3.5 h-3.5" /> Bosh sahifa
            </NavLink>
            <NavLink
              to="/user/profile"
              className={({ isActive }) =>
                cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent')
              }
            >
              <User className="w-3.5 h-3.5" /> Profilim
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.full_name}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Chiqish">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
