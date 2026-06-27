import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { getRouteApi } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCheck,
  Circle,
  Loader2,
  MessageSquareText,
  Send,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/features/auth'
import {
  messageKeys,
  useConversationMessages,
  useConversations,
  useMarkConversationRead,
  useMessagesSocket,
} from '@/features/messages'
import type {
  Conversation,
  Message,
  MessageCreatedPayload,
  MessagesReadPayload,
  PaginatedMessages,
} from '../types/messages.types'

interface MessagesPageProps {
  mode: 'guest' | 'host'
}

const guestRouteApi = getRouteApi('/guest/messages')
const hostRouteApi = getRouteApi('/host/messages')

function formatMessageDate(value: string) {
  const date = new Date(value)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

function formatThreadDate(value: string) {
  const date = new Date(value)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return `Yesterday, ${format(date, 'h:mm a')}`
  return format(date, 'MMM d, h:mm a')
}

function initials(value?: string | null) {
  if (!value) return 'U'
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function MessagesPage({ mode }: MessagesPageProps) {
  const routeApi = mode === 'guest' ? guestRouteApi : hostRouteApi
  const search = routeApi.useSearch() as { conversationId?: string }
  const navigate = routeApi.useNavigate()
  const queryClient = useQueryClient()
  const { user } = useCurrentUser()
  const [draft, setDraft] = useState('')
  const [mobileThreadOpen, setMobileThreadOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const conversationsQuery = useConversations()
  const conversations = conversationsQuery.data ?? []
  const selectedConversationId =
    search.conversationId && conversations.some((item) => item.id === search.conversationId)
      ? search.conversationId
      : conversations[0]?.id
  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId,
  )
  const messagesQuery = useConversationMessages(selectedConversationId)
  const markReadMutation = useMarkConversationRead()

  const upsertIncomingMessage = useCallback(
    (payload: MessageCreatedPayload) => {
      queryClient.setQueryData<PaginatedMessages>(
        messageKeys.conversationMessages(payload.conversationId),
        (current) => {
          if (!current) return current
          if (current.messages.some((message) => message.id === payload.message.id)) {
            return current
          }
          return {
            ...current,
            messages: [...current.messages, payload.message],
            total: current.total + 1,
          }
        },
      )

      queryClient.setQueryData<Conversation[]>(
        messageKeys.conversations,
        (current) =>
          current?.map((conversation) =>
            conversation.id === payload.conversationId
              ? {
                  ...conversation,
                  lastMessage: payload.message,
                  unreadCount:
                    payload.message.sender?.id === user?.id
                      ? conversation.unreadCount
                      : conversation.unreadCount + 1,
                }
              : conversation,
          ),
      )

      if (payload.conversationId === selectedConversationId) {
        markReadMutation.mutate(payload.conversationId)
      }
    },
    [markReadMutation.mutate, queryClient, selectedConversationId, user?.id],
  )

  const applyReadReceipt = useCallback(
    (payload: MessagesReadPayload) => {
      queryClient.setQueryData<Conversation[]>(
        messageKeys.conversations,
        (current) =>
          current?.map((conversation) =>
            conversation.id === payload.conversationId && payload.readerId === user?.id
              ? { ...conversation, unreadCount: 0 }
              : conversation,
          ),
      )
      void queryClient.invalidateQueries({
        queryKey: messageKeys.conversationMessages(payload.conversationId),
      })
    },
    [queryClient, user?.id],
  )

  const socket = useMessagesSocket({
    activeConversationId: selectedConversationId,
    onMessageCreated: upsertIncomingMessage,
    onMessagesRead: applyReadReceipt,
    onMessageError: (payload) => toast.error(payload.message),
  })

  useEffect(() => {
    if (!search.conversationId && selectedConversationId) {
      void navigate({
        search: (prev) => ({ ...prev, conversationId: selectedConversationId }),
        replace: true,
      })
    }
  }, [navigate, search.conversationId, selectedConversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messagesQuery.data?.messages.length, selectedConversationId])

  useEffect(() => {
    if (!selectedConversationId) return
    socket.markRead(selectedConversationId)
    markReadMutation.mutate(selectedConversationId)
  }, [selectedConversationId])

  const messages = messagesQuery.data?.messages ?? []
  const sortedConversations = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const aTime = a.lastMessage?.createdAt ?? a.createdAt
        const bTime = b.lastMessage?.createdAt ?? b.createdAt
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      }),
    [conversations],
  )

  const handleSelectConversation = (conversationId: string) => {
    setMobileThreadOpen(true)
    void navigate({
      search: (prev) => ({ ...prev, conversationId }),
      replace: false,
    })
  }

  const handleSend = () => {
    const content = draft.trim()
    if (!selectedConversationId || !content) return
    socket.sendMessage(selectedConversationId, content)
    setDraft('')
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[620px] overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <aside
        className={cn(
          'flex w-full flex-col border-r border-border md:w-80 lg:w-96',
          mobileThreadOpen && 'hidden md:flex',
        )}
      >
        <div className="border-b border-border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">Messages</h2>
              <p className="text-sm text-muted-foreground">
                Confirmed booking conversations
              </p>
            </div>
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                socket.isConnected
                  ? 'bg-emerald-500/10 text-emerald-700'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {socket.isConnected ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
              {socket.isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {conversationsQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading conversations...
            </div>
          )}

          {conversationsQuery.isError && (
            <div className="p-6 text-sm text-destructive">
              Failed to load conversations.
            </div>
          )}

          {!conversationsQuery.isLoading && sortedConversations.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageSquareText className="size-7" />
              </div>
              <h3 className="font-bold text-foreground">No conversations yet</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Messaging opens after a booking is confirmed.
              </p>
            </div>
          )}

          {sortedConversations.map((conversation) => {
            const isActive = conversation.id === selectedConversationId
            const participantName =
              conversation.otherParticipant?.name ||
              conversation.otherParticipant?.email ||
              'StayMate user'
            return (
              <button
                key={conversation.id}
                type="button"
                className={cn(
                  'flex w-full gap-3 border-b border-border/70 p-4 text-left transition-colors hover:bg-muted/50',
                  isActive && 'bg-primary/5',
                )}
                onClick={() => handleSelectConversation(conversation.id)}
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initials(participantName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {participantName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {conversation.listing?.title ?? 'Booking conversation'}
                      </p>
                    </div>
                    {conversation.lastMessage && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatMessageDate(conversation.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
                      {conversation.lastMessage?.content ?? 'No messages yet'}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      <section
        className={cn(
          'min-w-0 flex-1 flex-col',
          mobileThreadOpen || selectedConversation ? 'flex' : 'hidden md:flex',
        )}
      >
        {selectedConversation ? (
          <>
            <div className="flex items-center gap-3 border-b border-border p-4">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                onClick={() => setMobileThreadOpen(false)}
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {initials(
                  selectedConversation.otherParticipant?.name ||
                    selectedConversation.otherParticipant?.email,
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-bold text-foreground">
                  {selectedConversation.otherParticipant?.name ||
                    selectedConversation.otherParticipant?.email ||
                    'StayMate user'}
                </h3>
                <p className="truncate text-sm text-muted-foreground">
                  {selectedConversation.listing?.title ?? 'Booking conversation'}
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-4">
              {messagesQuery.isLoading && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading messages...
                </div>
              )}

              {!messagesQuery.isLoading && messages.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MessageSquareText className="size-7" />
                  </div>
                  <h3 className="font-bold text-foreground">Start the conversation</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Send the first message about check-in, arrival details, or stay questions.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {messages.map((message) => {
                  const isMine = message.sender?.id === user?.id
                  return (
                    <div
                      key={message.id}
                      className={cn('flex', isMine ? 'justify-end' : 'justify-start')}
                    >
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-4 py-2 shadow-sm',
                          isMine
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border bg-card text-card-foreground',
                        )}
                      >
                        <p className="whitespace-pre-line break-words text-sm leading-6">
                          {message.content}
                        </p>
                        <div
                          className={cn(
                            'mt-1 flex items-center justify-end gap-1 text-[11px]',
                            isMine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                          )}
                        >
                          <span>{formatThreadDate(message.createdAt)}</span>
                          {isMine && (
                            message.readAt ? (
                              <CheckCheck className="size-3.5" />
                            ) : (
                              <Circle className="size-2 fill-current" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="border-t border-border bg-card p-4">
              <div className="flex gap-2">
                <Textarea
                  value={draft}
                  rows={1}
                  maxLength={2000}
                  placeholder="Write a message..."
                  className="max-h-32 min-h-11 resize-none rounded-xl"
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      handleSend()
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon-lg"
                  className="h-11 w-11 shrink-0 rounded-xl"
                  disabled={!draft.trim() || !socket.isConnected}
                  onClick={handleSend}
                >
                  <Send className="size-4" />
                </Button>
              </div>
              {!socket.isConnected && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {socket.connectionError
                    ? `Live messaging unavailable: ${socket.connectionError}`
                    : 'Reconnecting to live messaging...'}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MessageSquareText className="size-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Select a conversation</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Choose a confirmed booking conversation from the inbox.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}




