import { formatDistanceToNow } from 'date-fns'
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../api/notifications.api'
import type { Notification, NotificationType } from '../types/notifications.types'

const notificationLabels: Record<NotificationType, string> = {
  new_message: 'New message',
  booking_confirmed: 'Booking confirmed',
  booking_cancelled: 'Booking cancelled',
  booking_completed: 'Booking completed',
  booking_rejected: 'Booking rejected',
  host_application_approved: 'Host approved',
  host_application_rejected: 'Host rejected',
  payout_paid: 'Payout paid',
}

export function NotificationBell() {
  const notificationsQuery = useNotifications('all')
  const unreadCountQuery = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = notificationsQuery.data?.items ?? []
  const unreadCount = unreadCountQuery.data?.count ?? 0
  const isLoading = notificationsQuery.isLoading || unreadCountQuery.isLoading

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-lg text-muted-foreground hover:text-foreground"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold leading-5 text-primary-foreground shadow-sm">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-1.5rem))] gap-0 p-0">
        <PopoverHeader className="flex-row items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <PopoverTitle>Notifications</PopoverTitle>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllRead.mutate()}
            disabled={unreadCount === 0 || markAllRead.isPending}
            className="h-8 gap-1.5 text-xs"
          >
            {markAllRead.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <CheckCheck className="size-3.5" />
            )}
            Mark all
          </Button>
        </PopoverHeader>

        <div className="max-h-[26rem] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Loading notifications
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  isMarkingRead={markRead.isPending}
                  onMarkRead={() => markRead.mutate(notification.id)}
                />
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function NotificationItem({
  notification,
  isMarkingRead,
  onMarkRead,
}: {
  notification: Notification
  isMarkingRead: boolean
  onMarkRead: () => void
}) {
  const payload = notification.payload ?? {}
  const title = payload.title ?? notificationLabels[notification.type]
  const message = payload.message ?? payload.preview ?? 'You have a new update'
  const isUnread = !notification.readAt

  return (
    <div
      className={cn(
        'flex gap-3 px-4 py-3 transition-colors',
        isUnread ? 'bg-primary/5' : 'bg-popover',
      )}
    >
      <span
        className={cn(
          'mt-1 size-2 shrink-0 rounded-full',
          isUnread ? 'bg-primary' : 'bg-transparent',
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
              {message}
            </p>
          </div>
          {isUnread && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onMarkRead}
              disabled={isMarkingRead}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              title="Mark as read"
              aria-label="Mark notification as read"
            >
              <Check className="size-3.5" />
            </Button>
          )}
        </div>
        <p className="mt-1.5 text-[11px] font-medium text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}
