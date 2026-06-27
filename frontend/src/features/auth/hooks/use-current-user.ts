import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../store/auth.store'
import { getMeFn, logoutFn } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: user = null, isLoading } = useQuery({
    queryKey: authKeys.me,
    queryFn: getMeFn,
    enabled: !!accessToken,
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  const logout = async () => {
    try {
      await logoutFn()
    } catch {
      // Local logout should still complete if the server session is gone.
    } finally {
      useAuthStore.getState().clearAccessToken()
      queryClient.clear()
      navigate({ to: '/login' })
    }
  }

  return {
    user,
    isAuthenticated: !!accessToken,
    isLoading,
    logout,
  }
}
