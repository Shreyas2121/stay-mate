export enum NotificationType {
  NewMessage = 'new_message',
  BookingConfirmed = 'booking_confirmed',
  BookingCancelled = 'booking_cancelled',
  BookingCompleted = 'booking_completed',
  BookingRejected = 'booking_rejected',
  HostApplicationApproved = 'host_application_approved',
  HostApplicationRejected = 'host_application_rejected',
  PayoutPaid = 'payout_paid',
}

export enum NotificationStatusFilter {
  All = 'all',
  Unread = 'unread',
  Read = 'read',
}