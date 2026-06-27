import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { refreshFn } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'
import { useAuthStore } from '../store/auth.store'

export function useSessionBootstrap() {
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current || accessToken) return
    hasRunRef.current = true

    refreshFn()
      .then((data) => {
        useAuthStore.getState().setAccessToken(data.access_token)
        queryClient.setQueryData(authKeys.me, data.user)
      })
      .catch(() => {
        useAuthStore.getState().clearAccessToken()
      })
  }, [accessToken, queryClient])
}
