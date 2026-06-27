import { apiClient } from '@/lib/api/client'
import type {
  ForgotPasswordFormData,
  LoginFormData,
  RegisterFormData,
  ResetPasswordFormData,
} from '../schemas/auth.schema'
import type {
  User,
  LoginResponse,
  BackendResponse,
  RefreshResponse,
  ForgotPasswordResponse,
  MessageResponse,
} from '../types/auth.types'

export async function loginFn(data: LoginFormData): Promise<LoginResponse> {
  const response = await apiClient.post<BackendResponse<LoginResponse>>(
    '/auth/login',
    data,
  )
  return response.data.data
}

export async function registerFn(data: RegisterFormData): Promise<User> {
  const payload = {
    email: data.email,
    password: data.password,
    name: data.fullName,
  }
  const response = await apiClient.post<BackendResponse<User>>(
    '/auth/register',
    payload,
  )
  return response.data.data
}

export async function refreshFn(): Promise<RefreshResponse> {
  const response = await apiClient.post<BackendResponse<RefreshResponse>>(
    '/auth/refresh',
  )
  return response.data.data
}

export async function logoutFn(): Promise<MessageResponse> {
  const response = await apiClient.post<BackendResponse<MessageResponse>>(
    '/auth/logout',
  )
  return response.data.data
}

export async function forgotPasswordFn(
  data: ForgotPasswordFormData,
): Promise<ForgotPasswordResponse> {
  const response = await apiClient.post<BackendResponse<ForgotPasswordResponse>>(
    '/auth/forgot-password',
    data,
  )
  return response.data.data
}

export async function resetPasswordFn(
  data: ResetPasswordFormData & { token: string },
): Promise<MessageResponse> {
  const response = await apiClient.post<BackendResponse<MessageResponse>>(
    '/auth/reset-password',
    data,
  )
  return response.data.data
}

export async function getMeFn(): Promise<User> {
  const response = await apiClient.get<BackendResponse<User>>('/auth/me')
  return response.data.data
}
