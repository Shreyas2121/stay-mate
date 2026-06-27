import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { queryClient } from './query-client'
import { apiBaseUrl } from './urls'
import type { BackendResponse, RefreshResponse } from '@/features/auth/types/auth.types'

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean }

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const requestUrl = originalRequest?.url ?? ''
    const isAuthRefresh = requestUrl.includes('/auth/refresh')
    const isAuthLogout = requestUrl.includes('/auth/logout')

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthRefresh &&
      !isAuthLogout
    ) {
      originalRequest._retry = true

      try {
        const refreshResponse = await axios.post<BackendResponse<RefreshResponse>>(
          `${apiBaseUrl}/auth/refresh`,
          {},
          { withCredentials: true },
        )
        const accessToken = refreshResponse.data.data.access_token
        useAuthStore.getState().setAccessToken(accessToken)
        queryClient.setQueryData(['auth', 'me'], refreshResponse.data.data.user)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().clearAccessToken()
        queryClient.clear()
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)
