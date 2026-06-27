import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../store/auth.store'
import { loginFn, registerFn, getMeFn } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

export function useAuth() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Login Mutation
  const loginMutation = useMutation({
    mutationFn: loginFn,
    onSuccess: async (data) => {
      // Store the JWT token
      useAuthStore.getState().setToken(data.access_token)

      // Seed profile into query cache
      await queryClient.fetchQuery({
        queryKey: authKeys.me,
        queryFn: getMeFn,
      })

      // Redirect to home page
      navigate({ to: '/' })
    },
  })

  // Register Mutation
  const registerMutation = useMutation({
    mutationFn: registerFn,
    onSuccess: async (_createdUser, variables) => {
      // Automatic login upon successful registration
      try {
        const loginData = await loginFn({
          email: variables.email,
          password: variables.password,
        })

        // Store the JWT token
        useAuthStore.getState().setToken(loginData.access_token)

        // Fetch profile and seed into query cache
        await queryClient.fetchQuery({
          queryKey: authKeys.me,
          queryFn: getMeFn,
        })

        // Redirect to homepage
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
