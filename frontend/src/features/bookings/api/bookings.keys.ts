export const bookingKeys = {
  all: ['bookings'] as const,
  my: ['bookings', 'my'] as const,
  host: ['bookings', 'host'] as const,
  detail: (bookingId: string) => ['bookings', 'detail', bookingId] as const,
}
