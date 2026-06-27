import { createFileRoute } from '@tanstack/react-router'
import { MessagesPage } from '@/features/messages'

export const Route = createFileRoute('/host/messages')({
  validateSearch: (search: Record<string, unknown>) => ({
    conversationId:
      typeof search.conversationId === 'string' ? search.conversationId : undefined,
  }),
  component: HostMessagesRoute,
})

function HostMessagesRoute() {
  return <MessagesPage mode="host" />
}
