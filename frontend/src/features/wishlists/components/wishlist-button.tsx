import type React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Heart, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth'
import { cn } from '@/lib/utils'
import { useToggleWishlist, useWishlistStatus } from '../api/wishlists.api'

interface WishlistButtonProps {
  listingId: string
  variant?: 'overlay' | 'button'
  className?: string
}

export function WishlistButton({
  listingId,
  variant = 'button',
  className,
}: WishlistButtonProps) {
  const navigate = useNavigate()
  const { isAuthenticated } = useCurrentUser()
  const statusQuery = useWishlistStatus(listingId, isAuthenticated)
  const toggleWishlist = useToggleWishlist()
  const isWishlisted = statusQuery.data?.isWishlisted ?? false
  const isBusy = statusQuery.isLoading || toggleWishlist.isPending

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (!isAuthenticated) {
      void navigate({ to: '/login' })
      return
    }

    toggleWishlist.mutate(listingId)
  }

  if (variant === 'overlay') {
    return (
      <button
        type="button"
        className={cn(
          'absolute right-3 top-3 z-10 flex size-10 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-sm transition-transform hover:scale-110 active:scale-95',
          isWishlisted && 'bg-white text-rose-500',
          className,
        )}
        onClick={handleClick}
        disabled={toggleWishlist.isPending}
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      >
        {isBusy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Heart
            className={cn(
              'size-5 drop-shadow-md',
              isWishlisted && 'fill-current',
            )}
          />
        )}
      </button>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={cn('gap-2 rounded-full', className)}
      onClick={handleClick}
      disabled={toggleWishlist.isPending}
    >
      {isBusy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Heart className={cn('size-4', isWishlisted && 'fill-current text-rose-500')} />
      )}
      {isWishlisted ? 'Saved' : 'Save'}
    </Button>
  )
}
