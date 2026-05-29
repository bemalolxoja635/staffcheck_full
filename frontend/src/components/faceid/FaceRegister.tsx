import { useEffect, useRef, useState } from 'react'
import { Camera, CheckCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

declare const faceapi: any

interface FaceRegisterProps {
  onCapture: (descriptors: number[][]) => void
}

const TOTAL = 5
const DIRECTIONS = ["To'g'ri qarang", 'Chapga burin', "O'ngga burin", 'Yuqoriga qarang', "To'g'ri qarang"]

export default function FaceRegister({ onCapture }: FaceRegisterProps) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const canvasRef  = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()

  const [modelsLoaded, setModelsLoaded] = useState(false)
  const [cameraOn,     setCameraOn]     = useState(false)
  const [status,       setStatus]       = useState('Modellar yuklanmoqda...')
  const [captured,     setCaptured]     = useState<number[][]>([])
  const [faceDetected, setFaceDetected] = useState(false)
  const [isCapturing,  setIsCapturing]  = useState(false)
  const [done,         setDone]         = useState(false)

  useEffect(() => {
    const loadFaceApi = () => {
      if ((window as any).faceapi) { loadModels(); return }
      const s = document.createElement('script')
      s.src = '/assets/vendor/face-api/face-api.min.js'
      s.async = true
      s.onload = loadModels
      document.head.appendChild(s)
    }
    loadFaceApi()
  }, [])

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models'),
      ])
      setModelsLoaded(true)
      setStatus("Tayyor. Kamerani yoqing.")
    } catch { setStatus('Modellar yuklanmadi.') }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } })
      if (videoRef.current) videoRef.current.srcObject = stream
      setCameraOn(true)
      setStatus("Yuzingizni kameraga to'g'rilang")
    } catch { setStatus('Kameraga ruxsat berilmadi') }
  }

  useEffect(() => {
    if (!cameraOn || !videoRef.current) return
    const video = videoRef.current
    const onLoaded = () => startLoop()
    video.addEventListener('loadeddata', onLoaded)
    return () => { video.removeEventListener('loadeddata', onLoaded); clearInterval(intervalRef.current) }
  }, [cameraOn])

  const startLoop = () => {
    clearInterval(intervalRef.current)
    const video  = videoRef.current!
    const canvas = canvasRef.current!
    faceapi.matchDimensions(canvas, { width: video.videoWidth || 640, height: video.videoHeight || 480 })

    intervalRef.current = setInterval(async () => {
      const dets = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptors()
      const resized = faceapi.resizeResults(dets, { width: video.videoWidth || 640, height: video.videoHeight || 480 })
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
      if (resized.length > 0) {
        faceapi.draw.drawDetections(canvas, resized)
        faceapi.draw.drawFaceLandmarks(canvas, resized)
        setFaceDetected(true)
      } else {
        setFaceDetected(false)
      }
    }, 200)
  }

  const captureFace = async () => {
    if (!videoRef.current || isCapturing || done) return
    setIsCapturing(true)
    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor()

    if (detection) {
      const newCaptured = [...captured, Array.from(detection.descriptor) as number[]]
      setCaptured(newCaptured)
      if (newCaptured.length >= TOTAL) {
        clearInterval(intervalRef.current)
        setDone(true)
        setStatus(`✅ ${TOTAL} ta surat saqlandi!`)
        onCapture(newCaptured)
      } else {
        setStatus(`${newCaptured.length}/${TOTAL} — ${DIRECTIONS[newCaptured.length]}`)
      }
    } else {
      setStatus("Yuz topilmadi. Qayta urinib ko'ring.")
    }
    setIsCapturing(false)
  }

  const reset = () => {
    setCaptured([])
    setDone(false)
    setFaceDetected(false)
    setStatus("Yuzingizni kameraga to'g'rilang")
    startLoop()
  }

  return (
    <div className="space-y-4">
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {!cameraOn && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={startCamera} disabled={!modelsLoaded} size="lg">
              <Camera className="w-5 h-5" /> Kamerani yoqish
            </Button>
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div className="space-y-2">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} className={`flex-1 h-2 rounded-full transition-all duration-300 ${i < captured.length ? 'bg-emerald-500' : 'bg-muted'}`} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">{status}</p>
      </div>

      <div className="flex gap-2">
        {cameraOn && !done && (
          <Button onClick={captureFace} disabled={!faceDetected || isCapturing} className="flex-1" loading={isCapturing}>
            <Camera className="w-4 h-4" /> Suratga olish ({captured.length}/{TOTAL})
          </Button>
        )}
        {captured.length > 0 && !done && (
          <Button variant="outline" size="icon" onClick={reset}><RotateCcw className="w-4 h-4" /></Button>
        )}
        {done && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium">
            <CheckCircle className="w-4 h-4" /> {TOTAL} ta surat saqlandi
          </div>
        )}
      </div>
    </div>
  )
}
