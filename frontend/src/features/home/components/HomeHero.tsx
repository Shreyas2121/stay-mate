import { ArrowRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { HomeFeaturedListings } from './home-featured-listings'
import { HomeSearch } from './home-search'
import { HomeSectionHeader } from './home-section-header'
import { PlatformCredibility } from './platform-credibility'

const workflowSteps = [
  {
    title: 'Search with intent',
    description:
      'Guests can choose a destination, dates, and party size before moving into filtered listing discovery.',
  },
  {
    title: 'Save and compare',
    description:
      'Wishlist support makes the marketplace feel personal and keeps high-intent stays easy to revisit.',
  },
  {
    title: 'Book, pay, and message',
    description:
      'The booking path connects availability, Stripe test payments, notifications, and guest-host messaging.',
  },
]

const trustSignals = [
  'Admin-reviewed listings',
  'Stripe test checkout',
  'Real-time messaging',
  'Wishlist-ready cards',
]

export function HomeHero() {
  return (
    <div className="bg-white text-slate-950">
      <section className="relative min-h-[calc(100svh-72px)] overflow-hidden bg-slate-950 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/hero-bg.png')" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.86)_0%,rgba(15,23,42,0.62)_46%,rgba(15,23,42,0.18)_100%)]" />

        <div className="relative mx-auto flex min-h-[calc(100svh-72px)] w-full max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
          <div className="max-w-3xl pb-8 pt-10 sm:pb-12">
            <div className="mb-5 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-sm font-medium text-white/90 backdrop-blur">
              Full-stack rental marketplace
            </div>
            <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-normal text-white sm:text-5xl lg:text-6xl">
              StayMate
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">
              A polished marketplace for discovering stays, saving favorites,
              booking trips, messaging hosts, and managing payouts from one
              coherent product flow.
            </p>
          </div>

          <HomeSearch />

          <div className="mt-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {trustSignals.map((signal) => (
              <div
                key={signal}
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-3 text-sm font-medium text-white/90 backdrop-blur"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      <HomeFeaturedListings />

      <section className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <HomeSectionHeader
            eyebrow="Product flow"
            title="A real guest journey, not a static catalog"
            description="The homepage introduces the same flows recruiters will inspect deeper in the app: discovery, saving, checkout, messaging, and post-booking activity."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-5 flex size-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <PlatformCredibility />

      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
              Ready to explore
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-normal sm:text-4xl">
              Start with listings, then follow the complete booking workflow.
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Button
              asChild
              className="h-11 rounded-lg bg-white px-5 text-slate-950 hover:bg-slate-100"
            >
              <Link to="/listings">
                Browse stays
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-lg border-white/30 bg-transparent px-5 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/become-host">Become a host</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
