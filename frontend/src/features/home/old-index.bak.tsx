import { createFileRoute, Link } from '@tanstack/react-router'
import {
  Home as HomeIcon,
  MapPin,
  Calendar,
  Users,
  Search,
  Star,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  Heart,
  BedDouble,
  Bath,
  ArrowRight,
  Building2,
  TreePine,
  Warehouse,
  DoorOpen,
  ChevronRight,
  Globe,
  Headphones,
  TrendingUp,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { useCurrentUser, useSwitchRole } from '@/features/auth'

export const Route = createFileRoute('/_old-index')({ component: Home })

// ─── Static Data ──────────────────────────────────────────────

interface Listing {
  id: string
  title: string
  location: string
  propertyType: 'apartment' | 'villa' | 'cabin' | 'room'
  pricePerNight: number
  rating: number
  reviewCount: number
  bedrooms: number
  bathrooms: number
  maxGuests: number
  image: string
  isSuperhost: boolean
}

interface Testimonial {
  id: string
  name: string
  location: string
  avatar: string
  rating: number
  comment: string
  stayedAt: string
}

interface Category {
  type: string
  label: string
  count: number
  icon: React.ReactNode
  description: string
}

const FEATURED_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Skyline Penthouse with Panoramic Views',
    location: 'Manhattan, New York',
    propertyType: 'apartment',
    pricePerNight: 285,
    rating: 4.96,
    reviewCount: 142,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    image: '/images/listings/apartment.png',
    isSuperhost: true,
  },
  {
    id: '2',
    title: 'Tropical Retreat with Private Infinity Pool',
    location: 'Ubud, Bali',
    propertyType: 'villa',
    pricePerNight: 195,
    rating: 4.92,
    reviewCount: 89,
    bedrooms: 3,
    bathrooms: 2,
    maxGuests: 6,
    image: '/images/listings/villa.png',
    isSuperhost: true,
  },
  {
    id: '3',
    title: 'Alpine A-Frame with Mountain Views',
    location: 'Aspen, Colorado',
    propertyType: 'cabin',
    pricePerNight: 175,
    rating: 4.88,
    reviewCount: 67,
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    image: '/images/listings/cabin.png',
    isSuperhost: false,
  },
  {
    id: '4',
    title: "Artist's Industrial Loft in SoHo",
    location: 'London, United Kingdom',
    propertyType: 'room',
    pricePerNight: 145,
    rating: 4.85,
    reviewCount: 203,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    image: '/images/listings/loft.png',
    isSuperhost: false,
  },
  {
    id: '5',
    title: 'Oceanfront Escape with Private Beach',
    location: 'Tulum, Mexico',
    propertyType: 'villa',
    pricePerNight: 320,
    rating: 4.97,
    reviewCount: 56,
    bedrooms: 4,
    bathrooms: 3,
    maxGuests: 8,
    image: '/images/listings/beach.png',
    isSuperhost: true,
  },
  {
    id: '6',
    title: 'Tuscan Stone Cottage with Lavender Gardens',
    location: 'Siena, Italy',
    propertyType: 'cabin',
    pricePerNight: 165,
    rating: 4.91,
    reviewCount: 118,
    bedrooms: 2,
    bathrooms: 1,
    maxGuests: 4,
    image: '/images/listings/cottage.png',
    isSuperhost: true,
  },
]

const PROPERTY_CATEGORIES: Category[] = [
  {
    type: 'apartment',
    label: 'Apartments',
    count: 2480,
    icon: <Building2 className="size-6" />,
    description: 'Urban stays with city views',
  },
  {
    type: 'villa',
    label: 'Villas',
    count: 1230,
    icon: <Warehouse className="size-6" />,
    description: 'Spacious luxury retreats',
  },
  {
    type: 'cabin',
    label: 'Cabins',
    count: 860,
    icon: <TreePine className="size-6" />,
    description: 'Nature getaways in the wild',
  },
  {
    type: 'room',
    label: 'Private Rooms',
    count: 3100,
    icon: <DoorOpen className="size-6" />,
    description: 'Affordable and comfortable',
  },
]

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't1',
    name: 'Sarah Mitchell',
    location: 'San Francisco, CA',
    avatar: 'SM',
    rating: 5,
    comment:
      "Absolutely blown away by the quality. The listing photos were 100% accurate and the host went above and beyond. StayMate's verification process gives me confidence I can't get anywhere else.",
    stayedAt: 'Skyline Penthouse, NYC',
  },
  {
    id: 't2',
    name: 'James Park',
    location: 'Seoul, South Korea',
    avatar: 'JP',
    rating: 5,
    comment:
      "I've used every major booking platform and StayMate is in a different league. The secure payment, instant host messaging, and transparent pricing — everything just works seamlessly.",
    stayedAt: 'Tropical Villa, Bali',
  },
  {
    id: 't3',
    name: 'Elena Rodriguez',
    location: 'Barcelona, Spain',
    avatar: 'ER',
    rating: 5,
    comment:
      "The cancellation flexibility saved our trip when plans changed last minute. Full refund, no hassle. Plus the host recommended incredible local restaurants we'd never have found.",
    stayedAt: 'Stone Cottage, Tuscany',
  },
]

const PLATFORM_STATS = [
  {
    value: '12,000+',
    label: 'Verified Listings',
    icon: <HomeIcon className="size-5" />,
  },
  {
    value: '8,500+',
    label: 'Trusted Hosts',
    icon: <ShieldCheck className="size-5" />,
  },
  { value: '45+', label: 'Countries', icon: <Globe className="size-5" /> },
  {
    value: '98%',
    label: 'Guest Satisfaction',
    icon: <TrendingUp className="size-5" />,
  },
]

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Search & Discover',
    description:
      'Browse verified listings by location, dates, guests, and amenities. Every property passes our 150-point quality checklist.',
    icon: <Search className="size-7" />,
  },
  {
    step: 2,
    title: 'Book with Confidence',
    description:
      'Secure your stay with our escrow-protected payments. See transparent pricing with no hidden fees — service fee, cleaning fee, everything upfront.',
    icon: <CreditCard className="size-7" />,
  },
  {
    step: 3,
    title: 'Stay & Connect',
    description:
      'Chat directly with your host, get local tips, and enjoy a seamless check-in. Leave a review after checkout to help the community.',
    icon: <MessageCircle className="size-7" />,
  },
]

// ─── Property Type Badge Styling ──────────────────────────────

const PROPERTY_TYPE_STYLES: Record<string, string> = {
  apartment: 'bg-[#2563eb]/10 text-[#2563eb]',
  villa: 'bg-[#3e3fcc]/10 text-[#3e3fcc]',
  cabin: 'bg-[#10b981]/10 text-[#10b981]',
  room: 'bg-[#f59e0b]/10 text-[#f59e0b]',
}

// ─── Sub-Components ───────────────────────────────────────────

function SiteHeader() {
  const { user, isAuthenticated, logout } = useCurrentUser()
  const switchRoleMutation = useSwitchRole()

  const handleSwitchRole = () => {
    if (!user) return
    const nextRole = user.activeRole === 'guest' ? 'host' : 'guest'
    switchRoleMutation.mutate(nextRole)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-xl">
      <div className="container-app">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <HomeIcon className="size-[18px]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              StayMate
            </span>
          </div>

          {/* Auth state */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden md:flex items-center gap-3">
                  {user.role === 'admin' && (
                    <Link
                      to="/admin/host-approvals"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all animate-in fade-in"
                    >
                      Admin Portal
                    </Link>
                  )}

                  {(user.role === 'host' || user.role === 'admin') && (
                    <button
                      onClick={handleSwitchRole}
                      disabled={switchRoleMutation.isPending}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold border border-border hover:bg-muted text-foreground px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {switchRoleMutation.isPending ? (
                        <RefreshCw className="size-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="size-3.5" />
                      )}
                      {user.activeRole === 'guest'
                        ? 'Switch to Host Mode'
                        : 'Switch to Guest Mode'}
                    </button>
                  )}

                  {user.activeRole === 'host' && (
                    <Link
                      to="/host/listings"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all"
                    >
                      Host Dashboard
                    </Link>
                  )}

                  {user.role === 'guest' && (
                    <Link
                      to="/become-host"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-all"
                    >
                      Become a Host
                    </Link>
                  )}
                </div>
                <div className="hidden md:block w-px h-6 bg-border" />

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-semibold text-foreground">
                      {user.name ?? 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {user.activeRole} Mode
                    </span>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary text-label-md">
                    {(user.name ?? user.email)[0].toUpperCase()}
                  </div>
                  <button
                    onClick={() => logout()}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted rounded-lg transition-all cursor-pointer"
                    title="Logout"
                    aria-label="Sign out"
                  >
                    <LogOut className="size-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-foreground hover:text-primary px-3 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/80 px-4 py-2.5 rounded-lg transition-all shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function HeroSection() {
  return (
    <header className="relative overflow-hidden bg-[#0b1c30]">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/hero-bg.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1c30]/70 via-[#0b1c30]/50 to-[#0b1c30]/90" />

      <div className="relative container-app py-20 sm:py-28 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* Tagline chip */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
            <ShieldCheck className="size-4 text-[#b4c5ff]" />
            Every host verified · Every stay guaranteed
          </span>

          <h1 className="mt-8 text-display-lg text-white">
            Find your perfect
            <span className="block text-[#b4c5ff]">home away from home</span>
          </h1>

          <p className="mt-6 text-body-lg text-white/70 max-w-xl mx-auto">
            Handpicked rental properties with verified hosts, transparent
            pricing, and secure booking. From city apartments to secluded
            cabins.
          </p>

          {/* Search bar */}
          <div className="mt-10 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row items-stretch gap-0 bg-white rounded-2xl p-2 shadow-2xl shadow-black/20">
              <SearchField
                icon={<MapPin className="size-5" />}
                label="Where"
                placeholder="Search destinations"
              />
              <Divider />
              <SearchField
                icon={<Calendar className="size-5" />}
                label="Check in"
                placeholder="Add dates"
              />
              <Divider />
              <SearchField
                icon={<Users className="size-5" />}
                label="Guests"
                placeholder="Add guests"
              />
              <button className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/85 text-primary-foreground font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary/25 shrink-0 sm:ml-1">
                <Search className="size-4" />
                <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>

          {/* Trust indicators */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="size-4" /> Verified hosts
            </span>
            <span className="flex items-center gap-1.5">
              <CreditCard className="size-4" /> Secure payments
            </span>
            <span className="flex items-center gap-1.5">
              <Headphones className="size-4" /> 24/7 support
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

function SearchField({
  icon,
  label,
  placeholder,
}: {
  icon: React.ReactNode
  label: string
  placeholder: string
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 sm:py-0 flex-1 min-w-0 group cursor-pointer rounded-xl hover:bg-[#f8f9ff] transition-colors">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-foreground tracking-wide">
          {label}
        </p>
        <p className="text-sm text-muted-foreground truncate">{placeholder}</p>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div className="hidden sm:flex items-center px-0">
      <div className="w-px h-8 bg-border" />
    </div>
  )
}

function FeaturedListings() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container-app">
        <SectionHeader
          overline="Curated Collection"
          title="Featured stays handpicked for you"
          description="Each property is personally vetted for quality, accuracy, and guest satisfaction before being listed."
        />

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {FEATURED_LISTINGS.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <button className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group">
            View all listings
            <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  )
}

function ListingCard({ listing }: { listing: Listing }) {
  const typeStyle = PROPERTY_TYPE_STYLES[listing.propertyType] ?? ''

  return (
    <article className="card-listing group cursor-pointer">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Wishlist button */}
        <button
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-white transition-all shadow-sm"
          aria-label={`Save ${listing.title} to wishlist`}
        >
          <Heart className="size-4" />
        </button>
        {/* Superhost badge */}
        {listing.isSuperhost && (
          <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-foreground shadow-sm">
            <ShieldCheck className="size-3 text-primary" />
            Superhost
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span
              className={`inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${typeStyle}`}
            >
              {listing.propertyType}
            </span>
            <h3 className="mt-1.5 text-body-md font-semibold text-foreground truncate">
              {listing.title}
            </h3>
            <p className="mt-0.5 text-body-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="size-3.5 shrink-0" />
              {listing.location}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0 pt-5">
            <Star className="size-4 fill-[#f59e0b] text-[#f59e0b]" />
            <span className="text-sm font-semibold text-foreground">
              {listing.rating}
            </span>
            <span className="text-xs text-muted-foreground">
              ({listing.reviewCount})
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <BedDouble className="size-3.5" />
            {listing.bedrooms} {listing.bedrooms === 1 ? 'bed' : 'beds'}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-3.5" />
            {listing.bathrooms} {listing.bathrooms === 1 ? 'bath' : 'baths'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            {listing.maxGuests} guests
          </span>
        </div>

        {/* Price */}
        <div className="mt-3 pt-3 border-t border-border-muted flex items-baseline gap-1">
          <span className="text-lg font-bold text-foreground">
            ${listing.pricePerNight}
          </span>
          <span className="text-sm text-muted-foreground">/ night</span>
        </div>
      </div>
    </article>
  )
}

function CategoryBrowser() {
  return (
    <section className="py-20 sm:py-28 bg-surface-subtle">
      <div className="container-app">
        <SectionHeader
          overline="Browse by Type"
          title="What kind of stay are you looking for?"
          description="Filter through property types to find the perfect match for your travel style."
        />

        <div className="mt-12 sm:mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {PROPERTY_CATEGORIES.map((category) => (
            <button
              key={category.type}
              className="group flex flex-col items-center gap-4 p-6 sm:p-8 rounded-2xl bg-card border border-border-muted hover:border-primary/30 hover:shadow-md transition-all duration-300 text-center cursor-pointer"
            >
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                {category.icon}
              </div>
              <div>
                <h3 className="text-body-md font-semibold text-foreground">
                  {category.label}
                </h3>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  {category.description}
                </p>
                <p className="mt-2 text-xs font-semibold text-primary">
                  {category.count.toLocaleString()} listings
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container-app">
        <SectionHeader
          overline="How It Works"
          title="Your next stay in 3 simple steps"
          description="From search to check-in, we've streamlined every part of the booking experience."
        />

        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div
              key={step.step}
              className="relative flex flex-col items-center text-center"
            >
              {/* Connector line (hidden on mobile and last item) */}
              {index < HOW_IT_WORKS_STEPS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-[60%] w-[calc(100%-20%)] h-px bg-gradient-to-r from-primary/30 to-primary/5" />
              )}

              <div className="relative flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-6">
                {step.icon}
                <span className="absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-md">
                  {step.step}
                </span>
              </div>

              <h3 className="text-headline-sm text-foreground">{step.title}</h3>
              <p className="mt-3 text-body-sm text-muted-foreground max-w-xs">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function StatsBar() {
  return (
    <section className="py-16 sm:py-20 bg-[#0b1c30]">
      <div className="container-app">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {PLATFORM_STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center gap-3"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-white/10 text-[#b4c5ff]">
                {stat.icon}
              </div>
              <div>
                <p className="text-headline-lg text-white">{stat.value}</p>
                <p className="mt-1 text-body-sm text-white/50">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="container-app">
        <SectionHeader
          overline="Guest Stories"
          title="Loved by travelers worldwide"
          description="Don't take our word for it — hear from guests who've experienced StayMate first-hand."
        />

        <div className="mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TESTIMONIALS.map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="flex flex-col p-6 sm:p-8 rounded-2xl bg-card border border-border-muted hover:shadow-md transition-all duration-300">
      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: testimonial.rating }, (_, i) => (
          <Star key={i} className="size-4 fill-[#f59e0b] text-[#f59e0b]" />
        ))}
      </div>

      {/* Comment */}
      <blockquote className="mt-4 flex-1 text-body-sm text-muted-foreground leading-relaxed">
        "{testimonial.comment}"
      </blockquote>

      {/* Stay reference */}
      <p className="mt-4 text-xs text-primary font-medium flex items-center gap-1">
        <MapPin className="size-3" />
        Stayed at {testimonial.stayedAt}
      </p>

      {/* Author */}
      <div className="mt-4 pt-4 border-t border-border-muted flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary text-label-md">
          {testimonial.avatar}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {testimonial.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {testimonial.location}
          </p>
        </div>
      </div>
    </div>
  )
}

function BecomeHostCTA() {
  return (
    <section className="py-20 sm:py-28 bg-surface-subtle">
      <div className="container-app">
        <div className="relative overflow-hidden rounded-3xl bg-[#0b1c30]">
          {/* Background image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: "url('/images/host-cta.png')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b1c30] via-[#0b1c30]/80 to-transparent" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 sm:p-12 lg:p-16">
            <div className="flex flex-col justify-center">
              <span className="text-label-sm text-[#b4c5ff] tracking-widest">
                Become a Host
              </span>
              <h2 className="mt-4 text-headline-lg sm:text-display-lg text-white">
                Turn your property into a{' '}
                <span className="text-[#b4c5ff]">source of income</span>
              </h2>
              <p className="mt-4 text-body-md text-white/60 max-w-md">
                Join thousands of hosts earning on StayMate. We handle the
                payments, provide 24/7 support, and connect you with quality
                guests worldwide.
              </p>

              <ul className="mt-8 space-y-3">
                {[
                  'Verified guest profiles for every booking',
                  'Transparent commission — just 2% platform fee',
                  'Weekly automated payouts to your bank',
                  'Dedicated host support team',
                ].map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-3 text-sm text-white/80"
                  >
                    <div className="flex size-5 items-center justify-center rounded-full bg-[#10b981]/20 text-[#10b981] shrink-0">
                      <ChevronRight className="size-3" />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  to="/become-host"
                  className="inline-flex items-center gap-2 bg-white text-[#0b1c30] font-semibold text-sm px-6 py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg"
                >
                  Start Hosting
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>

            {/* Right-side decorative stats */}
            <div className="hidden lg:flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    value: '$2,400',
                    label: 'Avg. monthly earnings',
                    icon: <TrendingUp className="size-5" />,
                  },
                  {
                    value: '98%',
                    label: 'Payout success rate',
                    icon: <CreditCard className="size-5" />,
                  },
                  {
                    value: '4.9★',
                    label: 'Host satisfaction',
                    icon: <Star className="size-5" />,
                  },
                  {
                    value: '< 24h',
                    label: 'Application review',
                    icon: <ShieldCheck className="size-5" />,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col items-center gap-2 p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-center"
                  >
                    <div className="text-[#b4c5ff]">{stat.icon}</div>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-white/50">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SiteFooter() {
  const footerLinks = {
    Explore: [
      'All Listings',
      'Apartments',
      'Villas',
      'Cabins',
      'Private Rooms',
    ],
    Hosting: [
      'Become a Host',
      'Host Resources',
      'Community Forum',
      'Responsible Hosting',
    ],
    Support: [
      'Help Center',
      'Safety Information',
      'Cancellation Policy',
      'Report a Concern',
    ],
    Company: ['About StayMate', 'Careers', 'Press', 'Blog'],
  }

  return (
    <footer className="bg-[#0b1c30] border-t border-white/10">
      {/* Main footer */}
      <div className="container-app py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HomeIcon className="size-4" />
              </div>
              <span className="text-lg font-bold text-white">StayMate</span>
            </div>
            <p className="mt-4 text-sm text-white/40 max-w-xs">
              Premium rental marketplace connecting quality travelers with
              verified hosts worldwide.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-label-md text-white mb-4">{title}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <span className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer">
                      {link}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-app py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">
            © {new Date().getFullYear()} StayMate, Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            {['Privacy', 'Terms', 'Sitemap'].map((item) => (
              <span
                key={item}
                className="text-sm text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── Shared Section Header ────────────────────────────────────

function SectionHeader({
  overline,
  title,
  description,
}: {
  overline: string
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-label-sm text-primary tracking-widest">{overline}</p>
      <h2 className="mt-3 text-headline-lg sm:text-display-lg text-foreground">
        {title}
      </h2>
      <p className="mt-4 text-body-md text-muted-foreground">{description}</p>
    </div>
  )
}

// ─── Page Component ───────────────────────────────────────────

function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <HeroSection />
        <FeaturedListings />
        <CategoryBrowser />
        <HowItWorks />
        <StatsBar />
        <TestimonialsSection />
        <BecomeHostCTA />
      </main>
      <SiteFooter />
    </div>
  )
}
