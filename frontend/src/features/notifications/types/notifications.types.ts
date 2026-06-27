export type NotificationType =
  | 'new_message'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'booking_rejected'
  | 'host_application_approved'
  | 'host_application_rejected'
  | 'payout_paid'

export type NotificationStatusFilter = 'all' | 'unread' | 'read'

export interface NotificationPayload {
  title?: string
  message?: string
  bookingId?: string
  listingId?: string
  conversationId?: string
  hostProfileId?: string
  payoutId?: string
  actorId?: string
  preview?: string
  amount?: number
  periodStart?: string
  periodEnd?: string
  rejectionReason?: string
  [key: string]: unknown
}

export interface Notification {
  id: string
  type: NotificationType
  payload: NotificationPayload | null
  readAt: string | null
  createdAt: string
}

export interface PaginatedNotifications {
  items: Notification[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UnreadNotificationCount {
  count: number
}
