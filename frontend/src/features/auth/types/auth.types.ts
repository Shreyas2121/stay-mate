export interface User {
  id: string
  email: string
  name?: string | null
  role: 'guest' | 'host' | 'admin'
  activeRole: 'guest' | 'host'
}

export interface LoginResponse {
  access_token: string
}

export interface BackendResponse<T> {
  success: boolean
  data: T
  timestamp: string
  path: string
}
