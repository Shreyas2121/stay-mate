export interface User {
  id: string
  email: string
  name?: string | null
  role: 'guest' | 'host' | 'admin'
  activeRole: 'guest' | 'host'
}

export interface AuthTokenResponse {
  access_token: string
  user: User
}

export type LoginResponse = AuthTokenResponse
export type RefreshResponse = AuthTokenResponse

export interface ForgotPasswordResponse {
  message: string
  devResetToken?: string
  resetUrl?: string
}

export interface MessageResponse {
  message: string
}

export interface BackendResponse<T> {
  success: boolean
  data: T
  timestamp: string
  path: string
}
