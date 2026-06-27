import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { backendBaseUrl } from '@/lib/api/urls'
import { useAuthStore } from '@/features/auth'
import type {
  MessageCreatedPayload,
  MessageErrorPayload,
  MessagesReadPayload,
} from '../types/messages.types'

interface UseMessagesSocketOptions {
  activeConversationId?: string
  onMessageCreated?: (payload: MessageCreatedPayload) => void
  onMessagesRead?: (payload: MessagesReadPayload) => void
  onMessageError?: (payload: MessageErrorPayload) => void
}

export function useMessagesSocket({
  activeConversationId,
  onMessageCreated,
  onMessagesRead,
  onMessageError,
}: UseMessagesSocketOptions) {
  const token = useAuthStore((state) => state.token)
  const socketRef = useRef<Socket | null>(null)
  const onMessageCreatedRef = useRef(onMessageCreated)
  const onMessagesReadRef = useRef(onMessagesRead)
  const onMessageErrorRef = useRef(onMessageError)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    onMessageCreatedRef.current = onMessageCreated
  }, [onMessageCreated])

  useEffect(() => {
    onMessagesReadRef.current = onMessagesRead
  }, [onMessagesRead])

  useEffect(() => {
    onMessageErrorRef.current = onMessageError
  }, [onMessageError])

  useEffect(() => {
    if (!token) return

    const nextSocket = io(`${backendBaseUrl}/messages`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
    })

    socketRef.current = nextSocket

    nextSocket.on('connect', () => {
      setIsConnected(true)
      setConnectionError(null)
    })
    nextSocket.on('disconnect', (reason) => {
      setIsConnected(false)
      setConnectionError(reason)
    })
    nextSocket.on('connect_error', (error) => {
      setIsConnected(false)
      setConnectionError(error.message)
      onMessageErrorRef.current?.({
        code: 'ConnectError',
        message: error.message || 'Unable to connect to live messaging',
      })
    })
    nextSocket.on('message_created', (payload: MessageCreatedPayload) => {
      onMessageCreatedRef.current?.(payload)
    })
    nextSocket.on('messages_read', (payload: MessagesReadPayload) => {
      onMessagesReadRef.current?.(payload)
    })
    nextSocket.on('message_error', (payload: MessageErrorPayload) => {
      onMessageErrorRef.current?.(payload)
    })

    return () => {
      nextSocket.disconnect()
      socketRef.current = null
      setIsConnected(false)
      setConnectionError(null)
    }
  }, [token])

  useEffect(() => {
    if (!socketRef.current || !activeConversationId) return
    socketRef.current.emit('join_conversation', {
      conversationId: activeConversationId,
    })
  }, [activeConversationId, isConnected])

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socketRef.current?.emit('send_message', { conversationId, content })
  }, [])

  const markRead = useCallback((conversationId: string) => {
    socketRef.current?.emit('mark_read', { conversationId })
  }, [])

  return useMemo(
    () => ({
      isConnected,
      connectionError,
      sendMessage,
      markRead,
    }),
    [connectionError, isConnected, markRead, sendMessage],
  )
}


