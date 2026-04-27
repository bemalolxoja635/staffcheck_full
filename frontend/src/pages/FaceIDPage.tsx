import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Shield } from 'lucide-react'
import FaceScanner from '@/components/faceid/FaceScanner'
import { authApi } from '@/api'
import type { FaceDescriptor, AttendanceResult } from '@/types'
import { formatTime } from '@/lib/utils'

export default function FaceIDPage() {
  const [descriptors, setDescriptors] = useState<FaceDescriptor[]>([])
  const [lastResult,  setLastResult]  = useState<AttendanceResult | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    authApi.getFaceDescriptors()
      .then(res => setDescriptors(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="orb orb-1" /><div className="orb orb-2" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Chiqish
          </Link>
          <div className="flex items-center gap-2 font-bold">
            <Shield className="w-5 h-5 text-primary" />
            Biometrik Davomat
          </div>
          <div className="w-16" />
        </div>

        {/* Scanner */}
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold">FaceID Davomat</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Shaxsingizni tasdiqlash uchun kameraga qarang
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <div className="w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Yuklanmoqda...</p>
            </div>
          ) : (
            <FaceScanner
              descriptors={descriptors}
              onResult={setLastResult}
            />
          )}
        </div>

        {/* Last result */}
        {lastResult && (
          <div className={`mt-4 p-4 rounded-2xl glass text-sm animate-fade-in ${
            lastResult.status === 'success' ? 'border-emerald-200' : 'border-red-200'
          }`}>
            <p className="font-medium">{lastResult.message}</p>
            {lastResult.user && (
              <p className="text-muted-foreground mt-0.5">
                {lastResult.user} • {lastResult.position}
                {lastResult.type && ` • ${lastResult.type === 'check_in' ? 'Keldi' : 'Ketdi'}`}
                {` • ${formatTime(new Date().toTimeString())}`}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
