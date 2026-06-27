export const messageKeys = {
  all: ['messages'] as const,
  conversations: ['messages', 'conversations'] as const,
  conversationMessages: (conversationId: string) =>
    ['messages', 'conversation', conversationId, 'messages'] as const,
}
