import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import { useAuthStore } from '../store/auth.store'
import type { User, BackendResponse } from '../types/auth.types'
import { authKeys } from '../api/auth.keys'

interface SwitchRoleResponse {
  access_token: string
  user: User
}

export function useSwitchRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (activeRole: 'guest' | 'host') => {
      const response = await apiClient.post<
        BackendResponse<SwitchRoleResponse>
      >('/auth/switch-role', { activeRole })
      return response.data.data
    },
    onSuccess: (data) => {
      useAuthStore.getState().setAccessToken(data.access_token)
      queryClient.setQueryData(authKeys.me, data.user)
    },
  })
}
