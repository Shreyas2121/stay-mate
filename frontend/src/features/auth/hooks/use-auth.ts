import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../store/auth.store'
import { getMeFn, loginFn, registerFn } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: loginFn,
    onSuccess: async (data) => {
      useAuthStore.getState().setAccessToken(data.access_token)
      queryClient.setQueryData(authKeys.me, data.user)

      await queryClient.fetchQuery({
        queryKey: authKeys.me,
        queryFn: getMeFn,
      })

      navigate({ to: '/' })
    },
  })

  const registerMutation = useMutation({
    mutationFn: registerFn,
    onSuccess: async (_createdUser, variables) => {
      try {
        const loginData = await loginFn({
          email: variables.email,
          password: variables.password,
        })

        useAuthStore.getState().setAccessToken(loginData.access_token)
        queryClient.setQueryData(authKeys.me, loginData.user)

        await queryClient.fetchQuery({
          queryKey: authKeys.me,
          queryFn: getMeFn,
        })

        navigate({ to: '/' })
      } catch (err) {
        console.error('Auto login failed after registration:', err)
        navigate({ to: '/login' })
      }
    },
  })

  return {
    loginMutation,
    registerMutation,
  }
}
