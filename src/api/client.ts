import axios from 'axios'
import { useAuthStore } from '@/store/useAuthStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const { token, expiresAt, clearUser } = useAuthStore.getState()
  
  if (expiresAt && Date.now() > expiresAt) {
    clearUser()
    return Promise.reject(new Error('Token expired'))
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearUser()
    }
    return Promise.reject(error)
  }
)
