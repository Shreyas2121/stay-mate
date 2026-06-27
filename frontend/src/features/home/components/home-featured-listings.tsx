import { ArrowRight, Loader2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { ListingCard, usePublicListings } from '@/features/listings'
import { HomeSectionHeader } from './home-section-header'

export function HomeFeaturedListings() {
  const { data, isLoading } = usePublicListings({ limit: 4, sortBy: 'newest' })
  const listings = data?.listings ?? []

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <HomeSectionHeader
            eyebrow="Featured stays"
            title="Fresh places to start the demo"
            description="Real listing cards show images, ratings, prices, guest capacity, and wishlist actions directly from the marketplace UI."
          />
          <Button asChild variant="outline" className="h-10 w-fit rounded-lg">
            <Link to="/listings">
              View all stays
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-10 flex min-h-64 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
            <Loader2 className="size-6 animate-spin text-slate-500" />
          </div>
        ) : listings.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-lg border border-slate-200 bg-slate-50 px-6 py-10">
            <h3 className="text-lg font-semibold text-slate-950">
              Listings will appear here
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Add or approve host listings to turn this section into a live
              storefront from the backend.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
