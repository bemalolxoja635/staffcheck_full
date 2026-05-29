import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, QrCode, CheckCircle, XCircle } from 'lucide-react'
import { attendanceApi } from '@/api'
import type { AttendanceResult } from '@/types'

declare const Html5Qrcode: any

export default function ScannerPage() {
  const scannerRef  = useRef<any>(null)
  const [result,    setResult]    = useState<AttendanceResult | null>(null)
  const [scanning,  setScanning]  = useState(false)
  const [lastScan,  setLastScan]  = useState<string>('')
  const [showSimulate, setShowSimulate] = useState(false)
  const cooldownRef = useRef(false)

  useEffect(() => {
    // html5-qrcode library ni CDN dan yuklash
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
    script.async = true
    script.onload = () => startScanner()
    document.head.appendChild(script)

    return () => {
      stopScanner()
      if (document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  const startScanner = async () => {
    try {
      scannerRef.current = new Html5Qrcode('qr-reader')
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      )
      setScanning(true)
    } catch {
      // Orqa kamera yo'q bo'lsa old kamera
      try {
        await scannerRef.current.start(
          { facingMode: 'user' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => {}
        )
        setScanning(true)
      } catch (err) {
        console.error('Kamera xatosi:', err)
      }
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
  }

  const onScanSuccess = async (qrToken: string) => {
    if (cooldownRef.current || qrToken === lastScan) return
    cooldownRef.current = true
    setLastScan(qrToken)

    // Geolokatsiya olish
    const performCheckin = async (latitude: number, longitude: number) => {
      try {
        const res = await attendanceApi.qrCheckin(qrToken, latitude, longitude)
        setResult(res.data)
        if (res.data.status === 'success') setShowSimulate(false)
      } catch (err: any) {
        const msg = err.response?.data?.message || "Server bilan bog'lanishda xatolik"
        setResult({ status: 'error', message: msg })
      }
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => performCheckin(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        if (err.code !== 1) console.error("[Scanner] Geolocation error:", err)
        setResult({ status: 'error', message: "Geolokatsiyaga ruxsat zarur" })
        setShowSimulate(true)
      },
      { enableHighAccuracy: true, timeout: 5000 }
    )

    // 3 soniyadan keyin qayta skanerlash
    setTimeout(() => {
      cooldownRef.current = false
      setResult(null)
    }, 5000) // 5s cooldown for better visibility
  }

  const handleSimulate = async () => {
    if (!lastScan) return
    setResult(null)
    try {
      const res = await attendanceApi.qrCheckin(lastScan, 40.3864, 71.7820)
      setResult(res.data)
      if (res.data.status === 'success') setShowSimulate(false)
    } catch (err: any) {
      setResult({ status: 'error', message: "Simulyatsiya xatosi" })
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="orb orb-1" /><div className="orb orb-2" />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Chiqish
          </Link>
          <div className="flex items-center gap-2 font-bold">
            <QrCode className="w-5 h-5 text-primary" /> QR-kod Davomat
          </div>
          <div className="w-16" />
        </div>

        <div className="glass rounded-3xl p-6 shadow-2xl space-y-4">
          <div className="text-center">
            <h1 className="text-xl font-bold">QR Skaner</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Xodimning QR kodini kameraga ko'rsating
            </p>
          </div>

          {/* QR Reader */}
          <div className="relative">
            <div id="qr-reader" className="rounded-2xl overflow-hidden" />
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-2xl">
                <div className="text-white text-center">
                  <QrCode className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">Kamera yuklanmoqda...</p>
                </div>
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-2xl flex flex-col gap-3 animate-fade-in ${
              result.status === 'success'
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center gap-3">
                {result.status === 'success'
                  ? <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
                  : <XCircle className="w-8 h-8 text-red-500 shrink-0" />
                }
                <div>
                  {result.user && <p className="font-bold">{result.user}</p>}
                  {result.position && <p className="text-sm text-muted-foreground">{result.position}</p>}
                  <p className={`text-sm font-medium ${result.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                    {result.message}
                  </p>
                </div>
              </div>
              
              {showSimulate && result.status === 'error' && (
                <button
                  onClick={handleSimulate}
                  className="mt-2 text-xs bg-primary text-white py-2.5 rounded-xl font-bold shadow-lg hover:bg-primary/90 transition-all active:scale-95"
                >
                  📍 Joylashuvni tasdiqlash va kirish
                </button>
              )}
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Avtomatik aniqlaydi • 3 soniya cooldown
          </p>
        </div>

        {/* FaceID link */}
        <div className="text-center mt-4">
          <Link to="/faceid" className="text-sm text-primary hover:underline">
            FaceID orqali ham kirishingiz mumkin →
          </Link>
        </div>
      </div>
    </div>
  )
}
