import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, User, LogOut, Shield, Moon, Sun } from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { useThemeStore } from '@/store/theme'
import { authApi } from '@/api'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function UserLayout() {
  const { user, logout, refreshToken } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {}
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      {/* Dynamic Background Orbs for 4K feel */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-500 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 blur-[120px] animate-pulse delay-700" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-primary/20 bg-background/60 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Shield className="w-5 h-5 text-white moving-icon" />
          </div>
          <span className="font-black tracking-tighter text-lg dark:glow-4k hidden sm:block">StaffCheck</span>
          
          <nav className="flex items-center gap-1 ml-4 bg-muted/50 p-1 rounded-2xl">
            <NavLink
              to="/user"
              end
              className={({ isActive }) =>
                cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300',
                  isActive ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground')
              }
            >
              <Home className="w-3.5 h-3.5" /> Bosh
            </NavLink>
            <NavLink
              to="/user/profile"
              className={({ isActive }) =>
                cn('flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300',
                  isActive ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground')
              }
            >
              <User className="w-3.5 h-3.5" /> Profil
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-1 text-primary">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-primary/10">
              {theme === 'dark' ? <Sun className="w-4 h-4 moving-icon" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-full hover:bg-destructive/10 text-destructive">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        <Outlet />
      </main>
    </div>
  )
}
