import { createFileRoute } from '@tanstack/react-router'
import { MessagesPage } from '@/features/messages'

export const Route = createFileRoute('/guest/messages')({
  validateSearch: (search: Record<string, unknown>) => ({
    conversationId:
      typeof search.conversationId === 'string' ? search.conversationId : undefined,
  }),
  component: GuestMessagesRoute,
})

function GuestMessagesRoute() {
  return <MessagesPage mode="guest" />
}
