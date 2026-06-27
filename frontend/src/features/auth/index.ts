// Store (token-only)
export { useAuthStore } from './store/auth.store'

// Hooks
export { useAuth } from './hooks/use-auth'
export { useCurrentUser } from './hooks/use-current-user'
export { useSwitchRole } from './hooks/use-switch-role'

// API functions
export { loginFn, registerFn, getMeFn } from './api/auth.api'
export { authKeys } from './api/auth.keys'

// Types
export type { User, LoginResponse, BackendResponse } from './types/auth.types'

// Schemas
export { loginSchema, registerSchema } from './schemas/auth.schema'
export type { LoginFormData, RegisterFormData } from './schemas/auth.schema'

// Components
export { AuthLayout } from './components/auth-layout'
export { LoginForm } from './components/login-form'
export { RegisterForm } from './components/register-form'
