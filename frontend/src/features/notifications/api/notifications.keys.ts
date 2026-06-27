import type { NotificationStatusFilter } from '../types/notifications.types'

const notificationKeyBase = ['notifications'] as const

export const notificationKeys = {
  all: notificationKeyBase,
  list: (status: NotificationStatusFilter = 'all') =>
    [...notificationKeyBase, 'list', status] as const,
  unreadCount: [...notificationKeyBase, 'unread-count'] as const,
}
