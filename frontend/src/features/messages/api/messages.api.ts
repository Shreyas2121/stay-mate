import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api/client'
import type { BackendResponse } from '@/features/auth'
import type { Conversation, PaginatedMessages } from '../types/messages.types'
import { messageKeys } from './messages.keys'

export function useConversations() {
  return useQuery({
    queryKey: messageKeys.conversations,
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<Conversation[]>>(
        '/messages/conversations',
      )
      return response.data.data
    },
  })
}

export function useEnsureBookingConversation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: string) => {
      const response = await apiClient.post<BackendResponse<Conversation>>(
        `/messages/conversations/booking/${bookingId}`,
      )
      return response.data.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversations })
    },
  })
}

export function useConversationMessages(conversationId?: string) {
  return useQuery({
    queryKey: messageKeys.conversationMessages(conversationId ?? 'none'),
    queryFn: async () => {
      const response = await apiClient.get<BackendResponse<PaginatedMessages>>(
        `/messages/conversations/${conversationId}/messages`,
        { params: { page: 1, limit: 100 } },
      )
      return response.data.data
    },
    enabled: Boolean(conversationId),
  })
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const response = await apiClient.patch<BackendResponse<{ updatedCount: number }>>(
        `/messages/conversations/${conversationId}/read`,
      )
      return response.data.data
    },
    onSuccess: (_data, conversationId) => {
      void queryClient.invalidateQueries({ queryKey: messageKeys.conversations })
      void queryClient.invalidateQueries({
        queryKey: messageKeys.conversationMessages(conversationId),
      })
    },
  })
}
