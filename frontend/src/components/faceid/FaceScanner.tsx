import { useEffect, useRef, useState, useCallback } from 'react'
import { CheckCircle, XCircle, Loader2, Eye, AlertTriangle } from 'lucide-react'
import { attendanceApi } from '@/api'
import type { AttendanceResult, FaceDescriptor } from '@/types'

declare const faceapi: any

interface FaceScannerProps {
  descriptors: FaceDescriptor[]
  onResult?: (result: AttendanceResult) => void
}

type ScanState = 'loading' | 'ready' | 'scanning' | 'blink' | 'verified' | 'success' | 'error' | 'empty'

export default function FaceScanner({ descriptors, onResult }: FaceScannerProps) {
  const videoRef        = useRef<HTMLVideoElement>(null)
  const canvasRef       = useRef<HTMLCanvasElement>(null)
  const matcherRef      = useRef<any>(null)
  const intervalRef     = useRef<ReturnType<typeof setInterval>>()
  const livenessRef     = useRef<'IDLE' | 'BLINK' | 'VERIFIED'>('IDLE')
  const currentUserRef  = useRef<string | null>(null)
  const isProcessingRef = useRef(false)

  const [scanState, setScanState] = useState<ScanState>('loading')
  const [statusMsg, setStatusMsg] = useState('Modellar yuklanmoqda...')
  const [result,    setResult]    = useState<AttendanceResult | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [debugInfo, setDebugInfo] = useState('')

  // ── Descriptor parser — barcha formatlarni qabul qiladi ──────────────────
  const parseDescriptors = (raw: any): Float32Array[] => {
    if (!raw) return []
    try {
      // Format 1: [[128 float], [128 float], ...] — ko'p surat (yangi)
      if (Array.isArray(raw) && Array.isArray(raw[0])) {
        const result = raw.map((d: any) => new Float32Array(d)).filter(f => f.length === 128)
        if (result.length > 0) return result
      }
      // Format 2: [float, float, ...128 ta son] — bitta descriptor (eski PHP)
      if (Array.isArray(raw) && typeof raw[0] === 'number' && raw.length === 128) {
        return [new Float32Array(raw)]
      }
      // Format 3: flat array 128*N ta son
      if (Array.isArray(raw) && typeof raw[0] === 'number' && raw.length > 128) {
        const result: Float32Array[] = []
        for (let i = 0; i + 128 <= raw.length; i += 128) {
          result.push(new Float32Array(raw.slice(i, i + 128)))
        }
        return result
      }
      // Format 4: JSON string
      if (typeof raw === 'string') {
        return parseDescriptors(JSON.parse(raw))
      }
      // Format 5: {0: float, ...} object
      if (typeof raw === 'object' && !Array.isArray(raw)) {
        return parseDescriptors(Object.values(raw))
      }
    } catch (e) {
      console.error('Parse xatosi:', e, raw)
    }
    return []
  }

  // ── face-api yuklash ──────────────────────────────────────────────────────
  useEffect(() => {
    if ((window as any).faceapi) { initModels(); return }
    const script = document.createElement('script')
    script.src = '/assets/vendor/face-api/face-api.min.js'
    script.async = true
    script.onload  = () => initModels()
    script.onerror = () => { setScanState('error'); setStatusMsg('face-api.js yuklanmadi') }
    document.head.appendChild(script)
    return () => clearInterval(intervalRef.current)
  }, [])

  const initModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models'),
      ])
      buildMatcher()
      await startCamera()
    } catch (err) {
      console.error(err)
      setScanState('error')
      setStatusMsg('Modellar yuklanmadi.')
    }
  }

  // ── Matcher qurish ────────────────────────────────────────────────────────
  const buildMatcher = useCallback(() => {
    if (!descriptors?.length) {
      setScanState('empty')
      setStatusMsg("Hech qanday xodim yuzi ro'yxatga olinmagan.")
      return
    }

    const labeled: any[] = []
    for (const u of descriptors) {
      const floats = parseDescriptors(u.face_descriptors)
      console.log(`[FaceID] User ${u.id} ${u.firstname}: ${floats.length} descriptor`)
      if (floats.length > 0) {
        try {
          labeled.push(new faceapi.LabeledFaceDescriptors(String(u.id), floats))
        } catch (e) { console.error(e) }
      }
    }

    setDebugInfo(`${labeled.length}/${descriptors.length} xodim yuklandi`)

    if (labeled.length === 0) {
      setScanState('empty')
      setStatusMsg('Descriptor yuklanmadi. Admin paneldan yuzni qayta saqlang.')
      return
    }

    // Threshold 0.5 — muvozanat (0.45 qattiq, 0.55 yumshoq)
    matcherRef.current = new faceapi.FaceMatcher(labeled, 0.5)
    console.log('[FaceID] Matcher tayyor, threshold: 0.5')
  }, [descriptors])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      })
      if (videoRef.current) videoRef.current.srcObject = stream
    } catch {
      setScanState('error')
      setStatusMsg('Kameraga ruxsat berilmadi.')
    }
  }

  // EAR formula
  const getEAR = (eye: any[]) => {
    const a = Math.hypot(eye[1].x - eye[5].x, eye[1].y - eye[5].y)
    const b = Math.hypot(eye[2].x - eye[4].x, eye[2].y - eye[4].y)
    const c = Math.hypot(eye[0].x - eye[3].x, eye[0].y - eye[3].y)
    return (a + b) / (2.0 * c)
  }

  // ── Detection loop ────────────────────────────────────────────────────────
  const startDetection = useCallback(() => {
    clearInterval(intervalRef.current)
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 }
    faceapi.matchDimensions(canvas, displaySize)

    intervalRef.current = setInterval(async () => {
      if (isProcessingRef.current || !matcherRef.current || video.paused || video.ended) return

      try {
        const dets = await faceapi
          .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptors()

        const resized = faceapi.resizeResults(dets, displaySize)
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)

        if (!resized.length) {
          livenessRef.current = 'IDLE'
          currentUserRef.current = null
          setScanState('ready')
          setStatusMsg('Kameraga qarang...')
          return
        }

        const det   = resized[0]
        const match = matcherRef.current.findBestMatch(det.descriptor)
        const isHit = match.label !== 'unknown' && match.distance < 0.5

        // Box + masofa ko'rsatish
        const box = det.detection.box
        if (ctx) {
          ctx.strokeStyle = isHit ? '#22c55e' : '#ef4444'
          ctx.lineWidth = 3
          ctx.strokeRect(box.x, box.y, box.width, box.height)
          ctx.fillStyle = isHit ? '#22c55e' : '#ef4444'
          ctx.font = 'bold 13px Arial'
          ctx.fillText(
            isHit ? `✓ ${match.distance.toFixed(2)}` : `✗ ${match.distance.toFixed(2)}`,
            box.x + 4, box.y - 6
          )
        }

        if (!isHit) {
          livenessRef.current = 'IDLE'
          currentUserRef.current = null
          setScanState('scanning')
          setStatusMsg(`Yuz tanilmadi (${match.distance.toFixed(2)})`)
          return
        }

        // Tanildi
        const uid = match.label
        if (currentUserRef.current !== uid) {
          currentUserRef.current = uid
          livenessRef.current = 'BLINK'
          setScanState('blink')
          setStatusMsg("Ko'zingizni bir marta qising!")
        }

        // Blink
        if (livenessRef.current === 'BLINK') {
          const lm  = det.landmarks
          const ear = (getEAR(lm.getLeftEye()) + getEAR(lm.getRightEye())) / 2
          // 0.25 threshold — odatiy ko'z uchun, kichik ko'z uchun 0.27
          if (ear < 0.27) {
            livenessRef.current = 'VERIFIED'
            setScanState('verified')
            setStatusMsg('✅ Tasdiqlandi!')
            clearInterval(intervalRef.current)
            setTimeout(() => recordAttendance(parseInt(uid)), 400)
          }
        }
      } catch (err) {
        console.error('[FaceID] Detection xatosi:', err)
      }
    }, 120)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onLoad = () => {
      setScanState('ready')
      setStatusMsg('Tayyor. Kameraga qarang...')
      startDetection()
    }
    video.addEventListener('loadeddata', onLoad)
    return () => {
      video.removeEventListener('loadeddata', onLoad)
      clearInterval(intervalRef.current)
    }
  }, [startDetection])

  // ── Record attendance ─────────────────────────────────────────────────────
  const recordAttendance = async (userId: number) => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true
    try {
      const res  = await attendanceApi.faceCheckin(userId)
      const data = res.data
      setResult(data)
      setScanState(data.status === 'success' ? 'success' : 'error')
      if (data.status === 'success') setScanCount(c => c + 1)
      onResult?.(data)

      setTimeout(() => {
        setResult(null); setScanState('ready')
        setStatusMsg('Tayyor. Kameraga qarang...')
        livenessRef.current = 'IDLE'
        currentUserRef.current = null
        isProcessingRef.current = false
        startDetection()
      }, data.status === 'success' ? 4000 : 2500)
    } catch {
      setResult({ status: 'error', message: "Server xatosi" })
      setScanState('error')
      setTimeout(() => {
        setScanState('ready'); isProcessingRef.current = false
        livenessRef.current = 'IDLE'; currentUserRef.current = null
        startDetection()
      }, 2000)
    }
  }

  const glowClass = (({
    success: 'shadow-[0_0_50px_rgba(34,197,94,0.7)]',
    error:   'shadow-[0_0_50px_rgba(239,68,68,0.6)]',
    blink:   'shadow-[0_0_50px_rgba(251,191,36,0.7)] animate-pulse',
    verified:'shadow-[0_0_50px_rgba(34,197,94,0.9)]',
    scanning:'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
  } as Record<string, string>)[scanState]) ?? 'shadow-[0_0_30px_rgba(99,102,241,0.4)] face-ring'

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative w-80 h-80">
        <div className={`absolute inset-0 rounded-full transition-all duration-500 ${glowClass}`} />
        <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-primary/30 bg-black">
          <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

          {(scanState === 'ready' || scanState === 'scanning') && (
            <div className="absolute left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent scan-line" />
          )}

          {(scanState === 'success' || scanState === 'error') && result && (
            <div className={`absolute inset-0 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm rounded-full ${
              scanState === 'success' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {scanState === 'success'
                ? <CheckCircle className="w-16 h-16 success-bounce mb-3" />
                : <XCircle className="w-16 h-16 mb-3 animate-bounce" />
              }
              <p className="font-bold text-white text-center px-4 text-sm">{result.user || 'Tanilmadi'}</p>
              {result.position && <p className="text-xs text-white/70">{result.position}</p>}
              <p className="text-xs text-center mt-1 px-4 opacity-90">{result.message}</p>
            </div>
          )}
        </div>

        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100">
          <defs><mask id="cm3"><rect width="100" height="100" fill="white"/><circle cx="50" cy="50" r="49" fill="black"/></mask></defs>
          <rect width="100" height="100" fill="rgba(0,0,0,0.75)" mask="url(#cm3)"/>
        </svg>

        {scanState === 'blink' && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 whitespace-nowrap animate-bounce">
            <Eye className="w-3.5 h-3.5" /> Ko'zingizni qising!
          </div>
        )}
        {scanState === 'verified' && (
          <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
            ✅ Tasdiqlandi!
          </div>
        )}
      </div>

      <div className="text-center space-y-2">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          scanState === 'loading'  ? 'bg-muted text-muted-foreground' :
          scanState === 'success'  ? 'bg-emerald-100 text-emerald-700' :
          scanState === 'error'    ? 'bg-red-100 text-red-700' :
          scanState === 'blink'    ? 'bg-amber-100 text-amber-700' :
          scanState === 'verified' ? 'bg-emerald-100 text-emerald-700' :
          scanState === 'scanning' ? 'bg-red-50 text-red-600' :
          'bg-primary/10 text-primary'
        }`}>
          {scanState === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {statusMsg}
        </div>

        {debugInfo && <p className="text-xs text-muted-foreground">{debugInfo}</p>}

        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span>Ro'yxatda: <strong>{descriptors.length}</strong></span>
          <span>•</span>
          <span>Skanlar: <strong>{scanCount}</strong></span>
        </div>

        {scanState === 'empty' && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Admin paneldan xodim yuzini saqlang
          </div>
        )}
      </div>
    </div>
  )
}
