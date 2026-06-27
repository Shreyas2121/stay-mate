import { getRouteApi, Link } from '@tanstack/react-router'
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'
import { Header } from '@/components/layouts/Header'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/features/auth'
import { usePublicListingDetail } from '../api/listings.api'
import { ListingContent } from './listing-details/listing-content'

const routeApi = getRouteApi('/listings_/$listingId')

export function ListingDetailsPage() {
  const { listingId } = routeApi.useParams()
  const { isAuthenticated } = useCurrentUser()
  const {
    data: listing,
    isLoading,
    isError,
  } = usePublicListingDetail(listingId)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="container-app flex-1 py-8">
        <div className="mb-6">
          <Link to="/listings">
            <Button variant="ghost" className="-ml-4 gap-2 hover:bg-slate-200">
              <ArrowLeft className="size-4" />
              Back to search
            </Button>
          </Link>
        </div>

        {isLoading && (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading listing...
            </p>
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center">
            <p className="font-semibold text-destructive">
              Failed to load this listing.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              It may no longer be available or the link may be incorrect.
            </p>
          </div>
        )}

        {listing && (
          <div className="space-y-10">
            <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-border/70 w-fit">
              <ShieldCheck className="size-4 text-primary" />
              Public listing detail
            </div>
            <ListingContent
              listing={listing}
              isAuthenticated={isAuthenticated}
            />
          </div>
        )}
      </main>
    </div>
  )
}
