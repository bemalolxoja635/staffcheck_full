import { Link } from 'react-router-dom'
import { Shield, Camera, QrCode, BarChart3, Monitor, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
            <Button size="xl" className="shadow-2xl shadow-primary/30">
              <Camera className="w-5 h-5" />
              FaceID orqali davomat
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/scanner">
            <Button size="xl" variant="outline">
              <QrCode className="w-5 h-5" />
              QR-kod Skaner
            </Button>
          </Link>
          <Link to="/login">
            <Button size="xl" variant="outline">
              <Shield className="w-5 h-5" />
              Boshqaruv Paneli
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ value, label }) => (
            <div key={label} className="glass rounded-2xl p-5 text-center hover:-translate-y-1 transition-transform">
              <p className="text-3xl font-extrabold gradient-text mb-1">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Asosiy <span className="gradient-text">Imkoniyatlar</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass rounded-2xl p-6 flex gap-4 hover:-translate-y-1 transition-all duration-300 hover:shadow-xl">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
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
