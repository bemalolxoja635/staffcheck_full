import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Camera, QrCode, AtSign, Phone, MapPin, Briefcase, Shield, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui/index'
import { attendanceApi, authApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import type { Attendance } from '@/types'
import { formatTime, getStatusLabel } from '@/lib/utils'

// ── User Dashboard ────────────────────────────────────────────────────────────
export function UserDashboard() {
  const { user }  = useAuthStore()
  const [myAtt,   setMyAtt]   = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    attendanceApi.list({ user_id: String(user.id) }).then(res => {
      setMyAtt((res.data as any).results ?? res.data)
    }).finally(() => setLoading(false))
  }, [user])

  const today = myAtt.find(a => a.date === new Date().toISOString().slice(0, 10))

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Xush kelibsiz, {user?.firstname}!</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <Card className={`border-2 ${today ? (today.att_status === 'on_time' ? 'border-emerald-200' : 'border-amber-200') : 'border-border'}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${
              today ? (today.att_status === 'on_time' ? 'bg-emerald-100' : 'bg-amber-100') : 'bg-muted'
            }`}>
              {today ? (today.att_status === 'on_time' ? '✅' : '⏰') : '📅'}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">Bugungi holat</p>
              {today ? (
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                  <span className="text-emerald-600 font-medium">▶ {formatTime(today.check_in)}</span>
                  {today.check_out && <span>◀ {formatTime(today.check_out)}</span>}
                  <Badge variant={today.att_status === 'on_time' ? 'success' : 'warning'}>
                    {getStatusLabel(today.att_status)}
                  </Badge>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">Hali davomat belgilanmagan</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Link to="/faceid">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white hover:-translate-y-1 transition-all shadow-lg cursor-pointer">
            <Camera className="w-8 h-8 mb-3" />
            <p className="font-bold">FaceID</p>
            <p className="text-sm text-white/70">Davomat belgilash</p>
          </div>
        </Link>
        <Link to="/user/profile">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 text-white hover:-translate-y-1 transition-all shadow-lg cursor-pointer">
            <QrCode className="w-8 h-8 mb-3" />
            <p className="font-bold">QR Kod</p>
            <p className="text-sm text-white/70">Profilimda mavjud</p>
          </div>
        </Link>
      </div>

      <Card>
        <div className="p-4 border-b">
          <h2 className="font-semibold">So'nggi davomatlar</h2>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="divide-y">
            {myAtt.slice(0, 7).map(att => (
              <div key={att.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">{att.date}</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-600">{formatTime(att.check_in)}</span>
                  {att.check_out && <span className="text-muted-foreground">{formatTime(att.check_out)}</span>}
                  <Badge variant={att.att_status === 'on_time' ? 'success' : 'warning'}>
                    {getStatusLabel(att.att_status)}
                  </Badge>
                </div>
              </div>
            ))}
            {myAtt.length === 0 && (
              <div className="text-center py-10 text-muted-foreground text-sm">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                Hali davomat yo'q
              </div>
            )}
          </div>
        )}
      </Card>
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
