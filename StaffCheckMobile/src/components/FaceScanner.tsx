import { useEffect, useRef, useState, useMemo } from 'react'
import { View, Text, StyleSheet, Vibration } from 'react-native'
import { Camera, useCameraDevice, useFrameProcessor } from 'react-native-vision-camera'
import { runOnJS } from 'react-native-reanimated'
import FaceDetection from '@react-native-ml-kit/face-detection'
import * as Location from 'expo-location'
import { faceCheckin, getChallenge } from '../api'

export default function FaceScanner({ descriptors, onSuccess }: { descriptors: any[], onSuccess?: (data: any) => void }) {
  const device = useCameraDevice('front')
  const [status, setStatus] = useState('Kameraga qarang...')
  const [processing, setProcessing] = useState(false)
  const blinkDetected = useRef(false)
  const matchedUser = useRef<{ id: number, name: string } | null>(null)

  const euclideanDistance = (a: number[], b: number[]) => {
    'worklet'
    if (!a || !b || a.length !== b.length) return 1
    let sum = 0
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2)
    }
    return Math.sqrt(sum)
  }

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    // JS thread call via runOnJS if needed, wait, @react-native-ml-kit/face-detection
    // detect() usually returns a promise, so we have to use runAsync if it's worklet
    // BUT since we just use it directly, we will try `FaceDetection.detect`
    const faces = FaceDetection.detect(frame as any, {
      performanceMode: 'fast',
      classificationMode: 'all',
      landmarkMode: 'all',
    }) as any 

    if (!faces || faces.length === 0) {
      matchedUser.current = null
      return
    }

    const face = faces[0] as any
    
    // 1. Matching (Solishtirish)
    const currentDescriptor = face.descriptor
    if (currentDescriptor && Array.isArray(currentDescriptor)) {
      let bestMatch: any = null
      let minDistance = 0.55 // Threshold

      for (const u of descriptors) {
        const uDescs = u.face_descriptors
        if (Array.isArray(uDescs)) {
          for (const d of uDescs) {
            const dist = euclideanDistance(d, currentDescriptor)
            if (dist < minDistance) {
              minDistance = dist
              bestMatch = { id: u.id, name: u.firstname }
            }
          }
        }
      }
      matchedUser.current = bestMatch
    }

    // 2. Liveness (Blink)
    const leftEye = face.leftEyeOpenProbability ?? 1
    const rightEye = face.rightEyeOpenProbability ?? 1
    
    if (leftEye < 0.25 && rightEye < 0.25 && matchedUser.current) {
      blinkDetected.current = true
      const uid = matchedUser.current.id
      runOnJS(handleMatch)(uid)
    }
  }, [descriptors])

  const handleMatch = async (userId: number) => {
    if (processing) return
    setProcessing(true)
    setStatus('Joylashuv aniqlanmoqda...')

    try {
      const challengeRes = await getChallenge()
      const challenge = challengeRes.data.challenge

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      
      const res = await faceCheckin(
        userId,
        loc.coords.latitude,
        loc.coords.longitude,
        challenge
      )
      
      Vibration.vibrate(200)
      setStatus(`✅ ${res.data.user} — ${res.data.message}`)
      onSuccess?.(res.data)
    } catch (e: any) {
      const msg = e.response?.data?.message || 'Xatolik yuz berdi'
      setStatus(`❌ ${msg}`)
    } finally {
      setTimeout(() => {
        setProcessing(false)
        setStatus('Kameraga qarang...')
        blinkDetected.current = false
      }, 3000)
    }
  }

  if (!device) return <View style={styles.container}><Text>Kamera topilmadi</Text></View>

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
      />
      <View style={styles.status}>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 20, overflow: 'hidden' },
  camera: { flex: 1 },
  status: {
    position: 'absolute', bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: { color: 'white', fontWeight: 'bold' },
})
