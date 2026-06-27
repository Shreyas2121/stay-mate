export interface MessageUser {
  id: string
  name?: string | null
  email: string
  avatarUrl?: string | null
}

export interface ConversationBooking {
  id: string
  status: string
  checkIn: string
  checkOut: string
}

export interface ConversationListing {
  id: string
  title: string
  locationText: string
}

export interface Message {
  id: string
  content: string
  readAt?: string | null
  createdAt: string
  sender: MessageUser | null
}

export interface Conversation {
  id: string
  createdAt: string
  booking: ConversationBooking
  listing: ConversationListing | null
  guest: MessageUser | null
  host: MessageUser | null
  otherParticipant: MessageUser | null
  lastMessage: Message | null
  unreadCount: number
}

export interface PaginatedMessages {
  messages: Message[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface MessageCreatedPayload {
  conversationId: string
  message: Message
}

export interface MessagesReadPayload {
  conversationId: string
  readerId: string
  updatedCount: number
}

export interface MessageErrorPayload {
  code: string
  message: string
}
