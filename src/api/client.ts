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
  const { expiresAt, clearUser } = useAuthStore.getState()
  
  if (expiresAt && Date.now() > expiresAt) {
    clearUser()
  }

  const currentToken = useAuthStore.getState().token
  if (currentToken) {
    config.headers.Authorization = `Bearer ${currentToken}`
  } else {
    delete config.headers.Authorization
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
