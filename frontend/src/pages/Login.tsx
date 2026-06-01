import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, AtSign, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/index'
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const { setAuth } = useAuthStore()
  const navigate    = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(username, password)
      setAuth(res.data.user, res.data.access, res.data.refresh)
      navigate(res.data.user.role === 'admin' ? '/admin' : '/user')
    } catch (err: any) {
      const data = err.response?.data;
      let msg = 'Xatolik yuz berdi';
      if (data) {
        if (typeof data.error === 'string') msg = data.error;
        else if (data.error?.message) msg = data.error.message;
        else if (typeof data.message === 'string') msg = data.message;
        else if (typeof data.detail === 'string') msg = data.detail;
      }
      setError(msg);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Xush kelibsiz!</h1>
          <p className="text-muted-foreground mt-1">Tizimga kirish uchun ma'lumotlarni kiriting</p>
        </div>

        {/* Card */}
        <div className="glass rounded-3xl p-8 shadow-2xl">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Username <span className="text-muted-foreground font-normal">(telefon emas)</span>
              </label>
              <Input
                icon={<AtSign className="w-4 h-4" />}
                placeholder="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Parol</label>
              <div className="relative">
                <Input
                  icon={<Lock className="w-4 h-4" />}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Tizimga kirish
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Akkauntingiz yo'qmi?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              Ro'yxatdan o'ting
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">← Asosiy sahifaga qaytish</Link>
        </p>
      </div>
    </div>
  )
}
