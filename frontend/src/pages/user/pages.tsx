import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Camera, QrCode, AtSign, Phone, MapPin, Briefcase, Shield, User, CalendarDays, CheckSquare, Wallet, Map } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/ui/index'
import { attendanceApi, authApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import type { Attendance, Task } from '@/types'
import { formatTime, getStatusLabel, cn } from '@/lib/utils'

// ── User Dashboard ────────────────────────────────────────────────────────────
export function UserDashboard() {
  const { user }  = useAuthStore()
  const [myAtt,   setMyAtt]   = useState<Attendance[]>([])
  const [tasks,   setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [distance, setDistance] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.id) return
    Promise.all([
      attendanceApi.list({ user_id: String(user.id) }),
      authApi.getTasks()
    ]).then(([attRes, taskRes]) => {
      setMyAtt((attRes.data as any).results ?? attRes.data)
      setTasks((taskRes.data as any).results ?? taskRes.data)
    }).finally(() => setLoading(false))

    // Real-time Geolocation tracking
    let watchId: number;
    const startTracking = () => {
      if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition((pos) => {
          const lat1 = pos.coords.latitude
          const lon1 = pos.coords.longitude
          // Office Coords (Matches backend settings)
          const lat2 = 40.3864
          const lon2 = 71.7820 
          
          const R = 6371e3 // metres
          const φ1 = lat1 * Math.PI/180
          const φ2 = lat2 * Math.PI/180
          const Δφ = (lat2-lat1) * Math.PI/180
          const Δλ = (lon2-lon1) * Math.PI/180

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

          const d = R * c
          setDistance(Math.round(d))
          setGeoError(null)
        }, (err) => {
          // Xatoni faqat bir marta console'ga chiqaramiz (keraksiz spamni oldini olish uchun)
          if (err.code === 1) {
             setGeoError("Manzilga ruxsat berilmagan")
          } else if (err.code === 2) {
             setGeoError("Manzil aniqlanmadi")
          } else {
             setGeoError("GPS xatosi")
             console.error("Geolocation error:", err)
          }
        }, {
          enableHighAccuracy: false, 
          timeout: 10000,
          maximumAge: 0
        })
      } else {
        setGeoError("Brauzer GPS'ni qo'llamadi")
      }
    }

    startTracking()
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }
  }, [user])

  const toggleTask = (id: number, val: boolean) => {
    authApi.updateTask(id, val).then(() => {
      setTasks(tasks.map(t => t.id === id ? { ...t, is_completed: val } : t))
    }).catch(console.error)
  }

  const today = myAtt.find(a => a.date === new Date().toISOString().slice(0, 10))

  // Calculate Salary
  const presentDays = myAtt.filter(a => a.att_status === 'on_time').length
  const estimatedSalary = presentDays * (user?.daily_rate || 0)

  // Simple calendar dots for this month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const monthDays = Array.from({length: daysInMonth}, (_, i) => {
    const dStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`
    return myAtt.find(a => a.date === dStr)
  })

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="relative z-10">
        <h1 className="text-3xl font-extrabold tracking-tight dark:glow-4k">
          Xush kelibsiz, <span className="text-primary">{user?.firstname}!</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1 flex items-center gap-2">
          <Clock className="w-4 h-4 moving-icon text-primary" />
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid gap-6">
        <Card className={`premium-card group relative overflow-hidden border-2 flex-col md:flex-row flex ${today ? (today.att_status === 'on_time' ? 'border-emerald-500/50' : 'border-amber-500/50') : 'border-primary/20'}`}>
          <div className="shimmer absolute inset-0 opacity-10 pointer-events-none" />
          <CardContent className="p-6 relative z-10 w-full flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex items-center gap-6">
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl shadow-2xl transition-transform group-hover:scale-110 duration-500 ${
                today ? (today.att_status === 'on_time' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500') : 'bg-primary/20 text-primary'
              }`}>
                {today ? (today.att_status === 'on_time' ? '✅' : '⏰') : '📅'}
              </div>
              <div>
                <p className="font-bold text-xl dark:glow-4k">Bugungi holat</p>
                {today ? (
                  <div className="flex items-center gap-2 mt-2 text-sm font-medium flex-wrap">
                    <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" /> {formatTime(today.check_in)}
                    </span>
                    {today.check_out && (
                      <span className="flex items-center gap-1 text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5" /> {formatTime(today.check_out)}
                      </span>
                    )}
                    <Badge variant={today.att_status === 'on_time' ? 'success' : 'warning'} className="px-2 py-1 uppercase tracking-wider text-[10px]">
                      {getStatusLabel(today.att_status)}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground mt-2 italic flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    Davomat belgilanmagan
                  </div>
                )}
              </div>
            </div>

            {/* Live Map / Distance widget */}
            <div className="bg-background/40 backdrop-blur rounded-2xl p-4 border border-primary/20 flex flex-col items-center min-w-[140px] text-center">
              <Map className="w-6 h-6 text-primary mb-2 animate-bounce" />
              <p className="text-xs font-medium text-muted-foreground">Ishxonagacha masofa</p>
              <p className={cn("text-lg font-black mt-1", geoError ? "text-destructive text-sm" : "text-foreground")}>
                {geoError ? (
                  <span className="leading-tight block">
                    {geoError}
                  </span>
                ) : (distance !== null ? `${distance} metr` : 'Aniqlanmoqda...')}
              </p>
              
              {geoError && (
                <div className="mt-2 space-y-1 w-full">
                  <p className="text-[9px] text-muted-foreground">Foydalanish uchun brauzer sozlamalaridan manzilga ruxsat bering.</p>
                  <div className="flex gap-1 justify-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[10px] h-7 px-2 border-primary/30 text-primary"
                      onClick={() => window.location.reload()}
                    >
                      Qayta urinish
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-[10px] h-7 px-2 border-amber-500/30 text-amber-500"
                      onClick={() => {
                        const lat1 = 40.3880
                        const lon1 = 71.7830
                        const lat2 = 40.3864
                        const lon2 = 71.7820 
                        const R = 6371e3
                        const φ1 = lat1 * Math.PI/180
                        const φ2 = lat2 * Math.PI/180
                        const Δφ = (lat2-lat1) * Math.PI/180
                        const Δλ = (lon2-lon1) * Math.PI/180
                        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2)
                        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
                        setDistance(Math.round(R * c))
                        setGeoError(null)
                      }}
                    >
                      Simulyatsiya
                    </Button>
                  </div>
                </div>
              )}
              {distance !== null && distance <= 500 && !geoError && (
                 <Badge variant="success" className="mt-1 text-[10px]">Siz hududdasiz</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-6">
          <Link to="/faceid">
            <div className="premium-card bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-6 rounded-3xl group cursor-pointer border border-primary/30 h-full flex flex-col items-center text-center hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-cyan-500 moving-icon" />
              </div>
              <p className="font-extrabold text-lg dark:glow-4k mb-1">FaceID</p>
              <p className="text-xs text-muted-foreground">Yuz orqali kelish/ketish</p>
            </div>
          </Link>
          <Link to="/user/profile">
            <div className="premium-card bg-gradient-to-br from-indigo-500/20 to-violet-600/20 p-6 rounded-3xl group cursor-pointer border border-primary/30 h-full flex flex-col items-center text-center hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6 text-indigo-500 moving-icon" />
              </div>
              <p className="font-extrabold text-lg dark:glow-4k mb-1">QR Kod</p>
              <p className="text-xs text-muted-foreground">Shaxsiy identifikator</p>
            </div>
          </Link>
        </div>

        {/* Calendar and Salary Details */}
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Calendar Widget */}
          <Card className="premium-card">
            <div className="p-4 border-b border-primary/10 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-sm">Shaxsiy Taqvim (Shu oy)</h2>
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1">
                {monthDays.map((att, idx) => (
                  <div 
                    key={idx} 
                    title={att ? `${att.date} - ${getStatusLabel(att.att_status)}` : `Kun ${idx+1}: Kelmagan`}
                    className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold ${
                      att 
                        ? (att.att_status === 'on_time' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500') 
                        : 'bg-muted text-muted-foreground/30'
                    }`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Salary Widget */}
          <Card className="premium-card flex flex-col justify-between overflow-hidden relative">
            <div className="absolute -right-4 -top-4 text-primary/5">
              <Wallet className="w-32 h-32" />
            </div>
            <div className="p-4 border-b border-primary/10 flex items-center gap-2 relative z-10">
              <Wallet className="w-5 h-5 text-primary" />
              <h2 className="font-bold text-sm">Oylik hisob-kitob (Taxminiy)</h2>
            </div>
            <CardContent className="p-4 relative z-10 flex-1 flex flex-col justify-center">
              <div className="text-3xl font-black text-primary dark:glow-4k mb-2">
                {estimatedSalary.toLocaleString('uz-UZ')} <span className="text-sm text-muted-foreground">so'm</span>
              </div>
              <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
                <span>Kelgan kunlar: <b className="text-foreground">{presentDays} ta</b></span>
                <span>Kunlik: <b className="text-foreground">{Number(user?.daily_rate).toLocaleString('uz-UZ')} so'm</b></span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Section */}
        <Card className="premium-card relative overflow-hidden border-2 border-primary/20">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <CheckSquare className="w-32 h-32" />
          </div>
          <div className="p-5 border-b border-primary/10 flex items-center justify-between relative z-10">
             <h2 className="font-extrabold text-lg flex items-center gap-2 dark:glow-4k">
               <CheckSquare className="w-6 h-6 text-primary moving-icon" /> Bugungi kun vazifalari
             </h2>
          </div>
          <CardContent className="p-0 relative z-10">
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <CheckSquare className="w-8 h-8 text-primary opacity-50" />
                </div>
                <p className="text-sm font-medium">Sizga hali vazifa biriktirilmagan</p>
                <p className="text-[11px] mt-1 opacity-70">Dam oling va ishingizni davom ettiring</p>
              </div>
            ) : (
              <div className="divide-y divide-primary/5">
                {tasks.map(task => (
                  <div key={task.id} className="p-5 flex items-start gap-4 hover:bg-primary/5 transition-colors group">
                    <div className="relative flex items-center mt-0.5">
                      <input 
                        type="checkbox" 
                        className="peer relative appearance-none w-5 h-5 border-2 border-primary/30 rounded-md checked:bg-primary checked:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer transition-all shrink-0"
                        checked={task.is_completed}
                        onChange={(e) => toggleTask(task.id, e.target.checked)}
                      />
                      <CheckSquare className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-[15px] leading-tight ${task.is_completed ? 'line-through text-muted-foreground opacity-70' : 'text-foreground'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className={`text-[13px] mt-1.5 leading-relaxed ${task.is_completed ? 'text-muted-foreground/40' : 'text-muted-foreground/80'}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        {task.deadline && !task.is_completed && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-destructive/10 border border-destructive/20 text-destructive px-2 py-0.5 rounded-full font-bold">
                            <Clock className="w-3 h-3" />
                            To: {formatTime(task.deadline).slice(11, 16) || formatTime(task.deadline).slice(0, 10)}
                          </span>
                        )}
                        <Badge variant={task.is_completed ? 'info' : 'default'} className="text-[9px] px-1.5 py-0 uppercase tracking-widest">
                          {task.is_completed ? 'Bajarilgan' : 'Jarayonda'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

// ── User Profile ──────────────────────────────────────────────────────────────
export function UserProfile() {
  const { user, setUser } = useAuthStore()
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    authApi.me().then(res => setUser(res.data))
  }, [])

  useEffect(() => {
    if (user?.qr_token && qrCanvasRef.current) {
      import('qrcode').then(QRCode => {
        QRCode.toCanvas(qrCanvasRef.current!, user.qr_token!, { width: 200, margin: 2 })
      })
    }
  }, [user?.qr_token])

  if (!user) return null

  const fields = [
    { icon: User,      label: "To'liq ism",    value: user.full_name },
    { icon: AtSign,    label: 'Username',       value: `@${user.username}` },
    { icon: Phone,     label: 'Telefon',        value: user.phone },
    { icon: Briefcase, label: 'Lavozim',        value: user.position },
    { icon: MapPin,    label: "Tug'ilgan joy",  value: user.birth_place || '-' },
    { icon: Shield,    label: 'Tizim',          value: 'Himoyalangan', isGreen: true },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Profilim</h1>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary text-xl font-bold flex items-center justify-center">
              {user.firstname[0]}{user.lastname[0]}
            </div>
            <div>
              <p className="text-xl font-bold">{user.full_name}</p>
              <p className="text-muted-foreground">{user.position}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600">Faol</span>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {fields.map(({ icon: Icon, label, value, isGreen }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                   <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-sm font-medium ${isGreen ? 'text-emerald-600' : ''}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Telegram ID linking */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Telegram xabarnomalar
            </h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <input 
                  type="text"
                  placeholder="Telegram ID raqamingiz"
                  defaultValue={user.telegram_id || ''}
                  id="tg_id_input"
                  className="w-full h-10 px-3 rounded-lg border bg-muted/30 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button 
                onClick={async () => {
                  const val = (document.getElementById('tg_id_input') as HTMLInputElement).value;
                  await authApi.updateMe({ telegram_id: val });
                  alert('Saqlandi!');
                }}
                className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Saqlash
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
              ID raqamingizni bilish uchun Telegram'da <b>@userinfobot</b> ga yozing. 
              Keyin <b>@StaffCheck_UzBot</b> ga kirib <b>/start</b> bosing.
            </p>
          </div>
        </CardContent>
      </Card>

      {user.qr_token && (
        <Card>
          <CardHeader><CardTitle>QR Kod</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="p-4 bg-white rounded-2xl shadow-inner">
              <canvas ref={qrCanvasRef} />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Bu QR kodni skaner oldida ko'rsating
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
