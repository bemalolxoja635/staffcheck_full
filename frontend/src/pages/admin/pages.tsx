import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, Save, RefreshCw, Users, UserCheck, UserX, AlertCircle, ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/ui/index'
import { attendanceApi, settingsApi, authApi, aiApi } from '@/api'
import FaceRegister from '@/components/faceid/FaceRegister'
import type { Attendance, AnalyticsData, MonitorData, Setting } from '@/types'
import { formatTime, getStatusLabel } from '@/lib/utils'

// ── Attendance Page ───────────────────────────────────────────────────────────
export function AttendancePage() {
  const [list,    setList]    = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [date,    setDate]    = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    setLoading(true)
    attendanceApi.list({ date }).then(res => {
      setList((res.data as any).results ?? res.data)
    }).finally(() => setLoading(false))
  }, [date])

  const exportCsv = async () => {
    const res = await attendanceApi.exportCsv(date, date)
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url; a.download = `attendance_${date}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Davomat</h1>
          <p className="text-muted-foreground text-sm mt-1">{list.length} ta yozuv</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="h-10 px-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <Button variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {['Xodim', 'Sana', 'Keldi', 'Ketdi', 'Holat', 'Usul'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map(att => (
                  <tr key={att.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{att.user_name}</p>
                      <p className="text-xs text-muted-foreground">{att.user_position}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{att.date}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{formatTime(att.check_in)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatTime(att.check_out)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={att.att_status === 'on_time' ? 'success' : 'warning'}>
                        {getStatusLabel(att.att_status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{att.method.toUpperCase()}</Badge>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">Bu kun uchun davomat yo'q</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}

// ── Analytics Page ────────────────────────────────────────────────────────────
export function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)

  const [prediction, setPrediction] = useState<string | null>(null)
  const [predLoading, setPredLoading] = useState(false)

  useEffect(() => {
    attendanceApi.analytics().then(res => setData(res.data))
    
    // AI tahlilini olish
    setPredLoading(true)
    aiApi.analytics().then(res => {
      setPrediction(res.data.prediction)
    }).finally(() => setPredLoading(false))
  }, [])

  if (!data) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const pieData = [
    { name: 'Vaqtida',  value: data.month_on_time, color: '#22c55e' },
    { name: 'Kechikdi', value: data.month_late,    color: '#f59e0b' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Tahlil</h1>
        <p className="text-muted-foreground text-sm mt-1">Davomat statistikasi</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Bugun kelgan',   value: data.today_present, color: 'text-emerald-500' },
          { label: 'Bugun kechikdi', value: data.today_late,    color: 'text-amber-500'   },
          { label: 'Bu oy vaqtida',  value: data.month_on_time, color: 'text-blue-500'    },
          { label: 'Bu oy kechikdi', value: data.month_late,    color: 'text-red-500'     },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-5 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Oxirgi 7 kun</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.weekly}>
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bu oy nisbati</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label>
                  {pieData.map(({ color }, i) => <Cell key={i} fill={color} />)}
                </Pie>
                <Legend /><Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Prediction Card */}
      <Card className="border-primary/20 bg-primary/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Sparkles size={120} className="text-primary" />
        </div>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="bg-primary p-2 rounded-lg text-white">
            <Sparkles size={20} />
          </div>
          <CardTitle>AI Tahlil va Bashorat (Gemini)</CardTitle>
        </CardHeader>
        <CardContent>
          {predLoading ? (
            <div className="flex items-center gap-3 text-muted-foreground text-sm">
              <Loader2 size={16} className="animate-spin" />
              Gemini ma'lumotlarni tahlil qilmoqda...
            </div>
          ) : prediction ? (
            <div className="prose prose-sm max-w-none text-foreground leading-relaxed whitespace-pre-wrap">
              {prediction}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Tahlil natijalari yuklanmadi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Monitor Page ──────────────────────────────────────────────────────────────
export function MonitorPage() {
  const [data,    setData]    = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await attendanceApi.monitor()
    setData(res.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const timer = setInterval(fetchData, 30000)
    return () => clearInterval(timer)
  }, [fetchData])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Real-time Monitor</h1>
          {data && <p className="text-muted-foreground text-sm mt-1">Yangilandi: {data.updated_at}</p>}
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Yangilash
        </Button>
      </div>
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users,       label: 'Jami',     value: data.total,   color: 'text-blue-500',    bg: 'bg-blue-50'    },
              { icon: UserCheck,   label: 'Kelgan',   value: data.present, color: 'text-emerald-500', bg: 'bg-emerald-50' },
              { icon: UserX,       label: 'Kelmagan', value: data.absent,  color: 'text-red-500',     bg: 'bg-red-50'     },
              { icon: AlertCircle, label: 'Kechikdi', value: data.late,    color: 'text-amber-500',   bg: 'bg-amber-50'   },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <Card key={label}>
                <div className="p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.attendances.map(att => (
              <Card key={att.id} className={`overflow-hidden border-l-4 ${att.status === 'on_time' ? 'border-l-emerald-500' : 'border-l-amber-500'}`}>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">
                      {att.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate text-sm">{att.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{att.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-600 font-medium">▶ {formatTime(att.check_in)}</span>
                    {att.check_out && <span className="text-muted-foreground">◀ {formatTime(att.check_out)}</span>}
                    <Badge variant={att.status === 'on_time' ? 'success' : 'warning'}>
                      {att.status === 'on_time' ? 'Vaqtida' : 'Kechikdi'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Settings Page ─────────────────────────────────────────────────────────────
export function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Setting>>({})
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)

  useEffect(() => {
    settingsApi.get().then(res => setSettings(res.data))
  }, [])

  const save = async () => {
    setLoading(true)
    await settingsApi.save(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Sozlamalar</h1>
        <p className="text-muted-foreground text-sm mt-1">Tizim sozlamalari</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Ish vaqti</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ish boshlanishi</label>
              <Input type="time" value={settings.start_time?.slice(0,5)||''} onChange={e => setSettings(s=>({...s,start_time:e.target.value+':00'}))} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ish tugashi</label>
              <Input type="time" value={settings.end_time?.slice(0,5)||''} onChange={e => setSettings(s=>({...s,end_time:e.target.value+':00'}))} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Kechikish chegarasi (daqiqa)</label>
            <Input type="number" min="0" max="60" value={settings.late_threshold_minutes||''} onChange={e=>setSettings(s=>({...s,late_threshold_minutes:e.target.value}))} className="max-w-40" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Kompaniya</CardTitle></CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Kompaniya nomi</label>
            <Input value={settings.company_name||''} onChange={e=>setSettings(s=>({...s,company_name:e.target.value}))} placeholder="StaffCheck" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Telegram Bot</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Bot Token</label>
            <Input value={settings.telegram_bot_token||''} onChange={e=>setSettings(s=>({...s,telegram_bot_token:e.target.value}))} placeholder="***token" />
            <p className="text-xs text-muted-foreground mt-1">@BotFather dan olingan token.</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Admin Telegram ID</label>
            <Input value={settings.admin_telegram_id||''} onChange={e=>setSettings(s=>({...s,admin_telegram_id:e.target.value}))} placeholder="12345678" />
            <p className="text-xs text-muted-foreground mt-1">Admin bot orqali xabarnoma olishi uchun (ID ni bilish uchun @userinfobot ga yozing).</p>
          </div>
        </CardContent>
      </Card>
      <Button onClick={save} loading={loading} size="lg">
        <Save className="w-4 h-4" />
        {saved ? '✓ Saqlandi!' : 'Saqlash'}
      </Button>
    </div>
  )
}

// ── Face Register Page ────────────────────────────────────────────────────────
export function FaceRegisterPage() {
  const { id }    = useParams<{ id: string }>()
  const navigate  = useNavigate()
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [captured, setCaptured] = useState<number[][] | null>(null)

  const save = async () => {
    if (!captured || !id) return
    setLoading(true)
    try {
      await authApi.saveFace(parseInt(id), captured)
      setSaved(true)
      setTimeout(() => navigate('/admin/users'), 2000)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <button onClick={() => navigate('/admin/users')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Xodimlar ro'yxatiga qaytish
      </button>
      <Card>
        <CardHeader><CardTitle>FaceID Ro'yxatdan O'tkazish</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {saved ? (
            <div className="text-center py-8 text-emerald-600">
              <p className="text-xl font-bold">✅ Muvaffaqiyatli saqlandi!</p>
            </div>
          ) : (
            <>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">
                Aniq tanish uchun <strong>5 ta surat</strong> olinadi.
              </p>
              <FaceRegister onCapture={setCaptured} />
              {captured && (
                <Button onClick={save} loading={loading} className="w-full" size="lg">Saqlash</Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
