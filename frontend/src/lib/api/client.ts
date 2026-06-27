import axios from 'axios'
import { useAuthStore } from '@/features/auth'
import { queryClient } from './query-client'
import { apiBaseUrl } from './urls'

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Attach JWT Token from Zustand Store
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response Interceptor: Handle Global Errors (like 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the API returns 401 (Unauthorized), we clear the local session
    if (error.response && error.response.status === 401) {
      useAuthStore.getState().clearToken()
      queryClient.clear()
    }
    return Promise.reject(error)
  },
)
