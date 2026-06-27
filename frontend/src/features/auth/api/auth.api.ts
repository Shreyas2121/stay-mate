import { apiClient } from '@/lib/api/client'
import type { LoginFormData, RegisterFormData } from '../schemas/auth.schema'
import type { User, LoginResponse, BackendResponse } from '../types/auth.types'

/**
 * Log in a user with email and password
 */
export async function loginFn(data: LoginFormData): Promise<LoginResponse> {
  const response = await apiClient.post<BackendResponse<LoginResponse>>(
    '/auth/login',
    data,
  )
  return response.data.data
}

/**
 * Register a new user
 */
export async function registerFn(data: RegisterFormData): Promise<User> {
  // Map frontend `fullName` to backend `name`
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

/**
 * Fetch the current user profile
 */
export async function getMeFn(): Promise<User> {
  const response = await apiClient.get<BackendResponse<User>>('/auth/me')
  return response.data.data
}
