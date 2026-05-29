import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const api = axios.create({
  // Mahalliy test uchun (masalan, Android emulator): http://10.0.2.2:8000/api
  // Real qurilma uchun kompyuter IP manzili: http://192.168.x.x:8000/api
  baseURL: 'http://10.0.2.2:8000/api', 
  timeout: 10000,
})

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const faceCheckin = (userId: number, lat: number, lng: number, challenge: string) =>
  api.post('/attendance/face/', { user_id: userId, lat, lng, challenge })

export const getChallenge = () =>
  api.get('/attendance/challenge/')

export const getFaceDescriptors = () =>
  api.get('/auth/face-descriptors/')

export const login = (username: string, password: string) =>
  api.post('/auth/login/', { username, password })

export default api
