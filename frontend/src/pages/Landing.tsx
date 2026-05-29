import { Link } from 'react-router-dom'
import { Shield, Camera, QrCode, BarChart3, Monitor, ArrowRight, CheckCircle, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useThemeStore } from '@/store/theme'

const features = [
  { icon: Camera,    title: 'FaceID Davomat',    desc: 'Biometrik yuz tanish texnologiyasi bilan tezkor va xavfsiz davomat' },
  { icon: QrCode,    title: 'QR-kod Skaner',     desc: 'Xodim QR kodini skanerlash orqali bir zumda davomat belgilash' },
  { icon: Monitor,   title: 'Real-time Monitor', desc: 'Kim kelgan, kim kelmagan — jonli ko\'rinish katta ekranda' },
  { icon: BarChart3, title: 'Tahlil va Hisobot', desc: 'Oylik, haftalik statistika va CSV eksport imkoniyati' },
]

const stats = [
  { value: '99%',  label: 'Aniqlik darajasi' },
  { value: '< 1s', label: 'Tanish tezligi'   },
  { value: '24/7', label: 'Ishlash vaqti'     },
  { value: '∞',    label: 'Xodimlar soni'     },
]

export default function Landing() {
  const { theme, toggleTheme } = useThemeStore()
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">StaffCheck</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-xl">
             {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </Button>
          <Link to="/login">
            <Button variant="outline" size="sm">Kirish</Button>
          </Link>
          <Link to="/register">
            <Button size="sm">Ro'yxatdan o'tish</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
          <Shield className="w-3.5 h-3.5" />
          AI-Powered Attendance System
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 animate-fade-in leading-tight">
          Xodimlarni{' '}
          <span className="gradient-text">Intellektual</span>
          <br />Nazorat Qilish Tizimi
        </h1>
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up">
          StaffCheck — biometrik FaceID, QR-kod va shaffof tahlillarga asoslangan
          zamonaviy xodimlar boshqaruv platformasi.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 animate-slide-up">
          <Link to="/faceid">
            <Button size="xl" className="shadow-2xl shadow-primary/30 transition-all duration-500 hover:scale-110 active:scale-95 group">
              <Camera className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              FaceID orqali davomat
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/scanner">
            <Button size="xl" variant="outline" className="transition-all duration-500 hover:scale-105 active:scale-95 hover:bg-primary/5 group">
              <QrCode className="w-5 h-5 group-hover:scale-110 transition-transform" />
              QR-kod Skaner
            </Button>
          </Link>
          <Link to="/login">
            <Button size="xl" variant="outline" className="transition-all duration-500 hover:scale-105 active:scale-95 hover:bg-primary/5 group">
              <Shield className="w-5 h-5 group-hover:text-primary transition-colors" />
              Boshqaruv Paneli
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ value, label }, idx) => (
            <div 
              key={label} 
              className={`glass rounded-2xl p-5 text-center transition-all duration-500 hover:scale-105 hover:shadow-[0_0_30px_-5px_hsl(var(--primary)/0.4)] ${
                idx % 2 === 0 ? 'animate-float-slow' : 'animate-float-delayed'
              }`}
            >
              <p className="text-3xl font-extrabold gradient-text mb-1 glow-4k">{value}</p>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12 animate-fade-in">
          Asosiy <span className="gradient-text glow-4k">Imkoniyatlar</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div 
              key={title} 
              className="glass rounded-2xl p-6 flex gap-4 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl group border border-primary/10 hover:border-primary/40 animate-slide-up"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                <Icon className="w-6 h-6 text-primary moving-icon" />
              </div>
              <div>
                <h3 className="font-bold mb-1 text-lg group-hover:text-primary transition-colors">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-2xl mx-auto px-6 pb-20 text-center">
        <div className="glass rounded-3xl p-10">
          <CheckCircle className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-3">Hoziroq boshlang</h2>
          <p className="text-muted-foreground mb-6">
            Ro'yxatdan o'ting va tizimdan foydalanishni boshlang
          </p>
          <Link to="/register">
            <Button size="lg">
              Ro'yxatdan o'tish <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
