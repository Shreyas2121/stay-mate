import { createFileRoute } from '@tanstack/react-router'
import { SavedListingsPage } from '@/features/wishlists'

export const Route = createFileRoute('/guest/saved')({
  component: SavedListingsPage,
})
