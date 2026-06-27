import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../store/auth.store'
import { getMeFn } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

/**
 * Reads user profile from React Query cache.
 * Derives `isAuthenticated` from Zustand token.
 * Single source of truth: token → Zustand, user → React Query.
 */
export function useCurrentUser() {
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: user = null, isLoading } = useQuery({
    queryKey: authKeys.me,
    queryFn: getMeFn,
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  const logout = () => {
    useAuthStore.getState().clearToken()
    queryClient.clear()
    navigate({ to: '/login' })
  }

  return {
    user,
    isAuthenticated: !!token,
    isLoading,
    logout,
  }
}
