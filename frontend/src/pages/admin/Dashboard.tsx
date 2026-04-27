import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Clock, UserCheck, UserX, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui/index'
import { usersApi, attendanceApi } from '@/api'
import type { AdminStats, Attendance } from '@/types'
import { formatTime, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function Dashboard() {
  const [stats,     setStats]     = useState<AdminStats | null>(null)
  const [today,     setToday]     = useState<Attendance[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      usersApi.stats(),
      attendanceApi.list({ date: new Date().toISOString().slice(0, 10) }),
    ]).then(([s, a]) => {
      setStats(s.data)
      setToday((a.data as any).results ?? a.data)
    }).finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { icon: Users,     label: 'Jami xodimlar',    value: stats.total_users,      color: 'text-blue-500',    bg: 'bg-blue-50'    },
    { icon: UserCheck, label: 'Bugun kelgan',      value: stats.today_attendance, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: AlertCircle, label: 'Kechikkan',        value: stats.late_today,       color: 'text-amber-500',   bg: 'bg-amber-50'   },
    { icon: UserX,     label: 'Kutilayotgan',      value: stats.pending_users,    color: 'text-red-500',     bg: 'bg-red-50'     },
  ] : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label} className="hover:-translate-y-1 transition-transform">
            <CardContent className="p-5">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's attendance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Bugungi davomat</CardTitle>
          <Link to="/admin/attendance" className="text-xs text-primary hover:underline">
            Barchasini ko'rish →
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {today.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Bugun hali hech kim kelmagan
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Xodim</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Keldi</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Ketdi</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {today.slice(0, 10).map(att => (
                    <tr key={att.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{att.user_name}</div>
                        <div className="text-xs text-muted-foreground">{att.user_position}</div>
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">{formatTime(att.check_in)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatTime(att.check_out)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={att.att_status === 'on_time' ? 'success' : 'warning'}>
                          {getStatusLabel(att.att_status)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { to: '/faceid',          label: 'FaceID Skaner',    icon: '📷', color: 'from-violet-500 to-purple-600' },
          { to: '/admin/users',     label: 'Xodimlar',        icon: '👥', color: 'from-blue-500 to-cyan-600'     },
          { to: '/admin/monitor',   label: 'Monitor',         icon: '🖥️', color: 'from-emerald-500 to-teal-600'  },
        ].map(({ to, label, icon, color }) => (
          <Link key={to} to={to}>
            <div className={`bg-gradient-to-br ${color} rounded-2xl p-5 text-white hover:-translate-y-1 transition-all cursor-pointer shadow-lg`}>
              <div className="text-3xl mb-2">{icon}</div>
              <p className="font-semibold">{label}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
