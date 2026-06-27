import { Bell, CreditCard, MessageSquare, ShieldCheck, Wallet } from 'lucide-react'
import { Link } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { HomeSectionHeader } from './home-section-header'

const platformHighlights = [
  {
    title: 'Host operations',
    description:
      'Hosts can create listings, manage booking activity, track reviews, and view earnings from a dedicated dashboard.',
    icon: Wallet,
  },
  {
    title: 'Admin controls',
    description:
      'Admins review listings, manage platform visibility, monitor earnings, and process payout workflows.',
    icon: ShieldCheck,
  },
  {
    title: 'Guest activity',
    description:
      'Guests receive notifications around bookings and payments while keeping conversations attached to trips.',
    icon: Bell,
  },
]

const capabilityTiles = [
  { label: 'Payment flow', icon: CreditCard },
  { label: 'Trip messaging', icon: MessageSquare },
  { label: 'Payout tracking', icon: Wallet },
]

export function PlatformCredibility() {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-8">
        <div>
          <HomeSectionHeader
            eyebrow="Marketplace depth"
            title="Built past the happy path"
            description="StayMate shows the operational surfaces expected from a rental marketplace: guest discovery, host inventory, admin review, notifications, payments, and payouts."
          />

          <div className="mt-8 grid gap-4">
            {platformHighlights.map((item) => {
              const Icon = item.icon

              return (
                <article
                  key={item.title}
                  className="grid grid-cols-[auto_1fr] gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-white shadow-xl">
          <img
            src="/images/host-cta.png"
            alt="StayMate host dashboard preview"
            className="h-72 w-full object-cover"
          />
          <div className="p-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {capabilityTiles.map((tile) => {
                const Icon = tile.icon

                return (
                  <div
                    key={tile.label}
                    className="rounded-lg border border-white/10 bg-white/10 p-4"
                  >
                    <Icon className="size-5 text-cyan-300" />
                    <p className="mt-3 text-sm font-medium text-white">
                      {tile.label}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-10 rounded-lg bg-cyan-600 hover:bg-cyan-700"
              >
                <Link to="/become-host">Open host flow</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-lg border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/listings">Explore listings</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
