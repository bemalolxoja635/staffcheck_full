import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, User, Phone, Lock, AtSign, MapPin, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/index'
import { authApi, aiApi } from '@/api'
import { Camera, Sparkles, Loader2 } from 'lucide-react'
import FaceRegister from '@/components/faceid/FaceRegister'

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [faceDescriptors, setFaceDescriptors] = useState<number[][] | null>(null)

  const [form, setForm] = useState({
    firstname: '', lastname: '', username: '',
    phone: '', position: '', birth_place: '',
    birth_date: '', password: '', password2: '',
  })
  const [ocrLoading, setOcrLoading] = useState(false)

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrLoading(true)
    setError('')

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const res = await aiApi.ocr(base64)
        
        // JSON parsing
        try {
          const data = JSON.parse(res.data.data)
          setForm(f => ({
            ...f,
            firstname: data.firstname || f.firstname,
            lastname:  data.lastname  || f.lastname,
            birth_date: data.birth_date || f.birth_date,
            phone: data.phone || f.phone
          }))
          setSuccess("Ma'lumotlar muvaffaqiyatli o'qildi!")
          setTimeout(() => setSuccess(''), 3000)
        } catch {
          setError("Ma'lumotlarni tahlil qilib bo'lmadi")
        }
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError("Rasm o'qishda xatolik")
    } finally {
      setOcrLoading(false)
    }
  }

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.password2) {
      setError('Parollar mos kelmadi')
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      await authApi.register({
        firstname:        form.firstname,
        lastname:         form.lastname,
        username:         form.username,
        phone:            form.phone,
        position:         form.position,
        birth_place:      form.birth_place,
        birth_date:       form.birth_date || null,
        password:         form.password,
        face_descriptors: faceDescriptors,
      })
      setSuccess("Muvaffaqiyatli ro'yxatdan o'tdingiz! Admin tasdiqlashini kuting.")
      setTimeout(() => navigate('/login'), 3000)
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Xatolik yuz berdi';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.message && typeof data.message === 'string') msg = data.message;
        else if (data.error && typeof data.error === 'string') msg = data.error;
        else {
           const vals = Object.values(data).flat();
           if (vals.length > 0) {
             if (typeof vals[0] === 'string') msg = vals[0];
             else if (typeof vals[0] === 'object' && vals[0] !== null) {
               msg = (vals[0] as any).message || (vals[0] as any).code || JSON.stringify(vals[0]);
             }
           }
        }
      }
      setError(msg);
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass rounded-3xl p-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold mb-2">Muvaffaqiyatli!</h2>
          <p className="text-muted-foreground">{success}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="orb orb-1" /><div className="orb orb-2" />
      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary shadow-xl shadow-primary/30 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Ro'yxatdan o'tish</h1>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2].map(n => (
              <div key={n} className={`h-1.5 rounded-full transition-all ${n === step ? 'w-8 bg-primary' : 'w-4 bg-muted'}`} />
            ))}
          </div>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">Shaxsiy ma'lumotlar</h2>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScan}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    id="ocr-upload"
                    disabled={ocrLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/30 text-primary hover:bg-primary/5"
                    disabled={ocrLoading}
                  >
                    {ocrLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Passportni skanerlash
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Ism</label>
                  <Input icon={<User className="w-4 h-4" />} placeholder="Ism" value={form.firstname} onChange={set('firstname')} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Familiya</label>
                  <Input placeholder="Familiya" value={form.lastname} onChange={set('lastname')} required />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Username</label>
                <Input icon={<AtSign className="w-4 h-4" />} placeholder="username" value={form.username} onChange={set('username')} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Telefon</label>
                <Input icon={<Phone className="w-4 h-4" />} placeholder="+998901234567" value={form.phone} onChange={set('phone')} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Lavozim</label>
                <Input icon={<Briefcase className="w-4 h-4" />} placeholder="Masalan: O'qituvchi" value={form.position} onChange={set('position')} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Tug'ilgan sana</label>
                  <Input type="date" value={form.birth_date} onChange={set('birth_date')} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tug'ilgan joy</label>
                  <Input icon={<MapPin className="w-4 h-4" />} placeholder="Shahar" value={form.birth_place} onChange={set('birth_place')} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Parol</label>
                <Input icon={<Lock className="w-4 h-4" />} type="password" placeholder="Kamida 8 belgi, harf va raqam" value={form.password} onChange={set('password')} required />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Parolni tasdiqlang</label>
                <Input icon={<Lock className="w-4 h-4" />} type="password" placeholder="Parolni qayta kiriting" value={form.password2} onChange={set('password2')} required />
              </div>
              <Button type="submit" className="w-full" size="lg">
                Keyingisi →
              </Button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">FaceID Ro'yxatdan o'tish</h2>
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Orqaga</button>
              </div>
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl p-3">
                Aniq tanish uchun <strong>5 ta surat</strong> olinadi. Har gal boshingizni oz-oz buring.
                FaceID majburiy emas — o'tkazib yuborish mumkin.
              </p>
              <FaceRegister onCapture={setFaceDescriptors} />
              <Button
                onClick={handleSubmit}
                className="w-full"
                size="lg"
                loading={loading}
              >
                {faceDescriptors ? "FaceID bilan ro'yxatdan o'tish" : "FaceIDsiz ro'yxatdan o'tish"}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Akkauntingiz bormi?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">Kirish</Link>
        </p>
      </div>
    </div>
  )
}
