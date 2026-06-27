// Store (token-only)
export { useAuthStore } from './store/auth.store'

// Hooks
export { useAuth } from './hooks/use-auth'
export { useCurrentUser } from './hooks/use-current-user'
export { useSwitchRole } from './hooks/use-switch-role'
export { useSessionBootstrap } from './hooks/use-session-bootstrap'

// API functions
export { loginFn, registerFn, getMeFn, refreshFn, logoutFn, forgotPasswordFn, resetPasswordFn } from './api/auth.api'
export { authKeys } from './api/auth.keys'

// Types
export type { User, LoginResponse, BackendResponse } from './types/auth.types'

// Schemas
export { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from './schemas/auth.schema'
export type { LoginFormData, RegisterFormData, ForgotPasswordFormData, ResetPasswordFormData } from './schemas/auth.schema'

// Components
export { AuthLayout } from './components/auth-layout'
export { LoginForm } from './components/login-form'
export { RegisterForm } from './components/register-form'
export { ForgotPasswordForm } from './components/forgot-password-form'
export { ResetPasswordForm } from './components/reset-password-form'


