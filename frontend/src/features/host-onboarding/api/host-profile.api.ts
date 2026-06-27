import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type {
  HostOnboardingForm,
  HostProfileStatus,
} from '../types/host-onboarding.types'
import { hostProfileKeys } from './host-profile.keys'

export function useHostProfileStatus(isAuthenticated: boolean) {
  return useQuery({
    queryKey: hostProfileKeys.status,
    queryFn: async () => {
      const response = await apiClient.get<
        BackendResponse<HostProfileStatus | null>
      >('/host-profiles/status')
      return response.data.data
    },
    enabled: isAuthenticated,
    retry: false,
  })
}

export function useApplyForHosting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: HostOnboardingForm) => {
      // Remove agreeToTerms before posting because of backend whitelist check
      const { agreeToTerms, ...payload } = data
      const response = await apiClient.post<
        BackendResponse<{ message: string }>
      >('/host-profiles/apply', payload)
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: hostProfileKeys.status,
      })
    },
  })
}
