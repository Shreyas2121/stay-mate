# StayMate — Rental Marketplace

> Portfolio project · Never going live · Built to show to recruiters  
> Airbnb-type rental platform with real-time messaging, booking engine, commission flow, and host verification

---

## Overview

StayMate is a full-stack rental marketplace where users can list properties, search and book stays, and communicate in real time. The project is scoped to demonstrate senior full-stack engineering across architecture, payments, real-time systems, and deployment — not just CRUD.

- **Type:** Portfolio / showcase project
- **Target audience:** Recruiters at product companies (Indian + global MNCs)
- **Timeline:** 10–12 weeks
- **Currency:** USD — Stripe test mode, no real money

---

## Tech Stack

### Backend

| Layer | Choice | Reason |
|---|---|---|
| Framework | NestJS (TypeScript) | Shows DI, modules, guards, interceptors — enterprise patterns |
| Language | TypeScript | End-to-end type safety, resume signal |
| Database | PostgreSQL + TypeORM | Industry standard, decorator-based entities, clean migrations |
| Cache | Redis | Session store, rate limiting |
| Real-time | Socket.io | Guest ↔ host messaging |
| Auth | JWT + refresh tokens | Access + refresh token rotation, no OAuth for simplicity |
| File storage | Local `/uploads` (served statically) | No external dependency — clean for portfolio demo |
| Email | Nodemailer (or Resend free tier) | Booking confirmations, host alerts |
| Payments | Stripe test mode only | Globally recognised, no real account needed |
| Scheduler | `@nestjs/schedule` | Weekly payout cron job |

### Frontend

| Layer | Choice | Reason |
|---|---|---|
| Framework | React + Vite | Fast dev server, modern bundler |
| Language | TypeScript | Consistent with backend |
| Styling | Tailwind CSS | Fast UI, clean output |
| State | Zustand | Lightweight, no boilerplate |
| Maps | Leaflet + OpenStreetMap | 100% free, no API key, no signup |
| Geocoding | Nominatim (OSM) | Free, 1 req/sec — fine for portfolio |
| HTTP client | Axios + React Query | Caching, loading states, optimistic updates |

### Infrastructure / Dev

| Layer | Choice |
|---|---|
| Containerisation | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Hosting | Railway or Fly.io (free tier) |
| API docs | Swagger (auto-generated via NestJS decorators) |
| Testing | Jest (unit) + Supertest (e2e) |

---

## User Types

Three roles. One account — role switching between Guest and Host.

| Role | Description |
|---|---|
| **Guest** | Default role on registration. Searches, books, pays, reviews, messages hosts. |
| **Host** | Unlocked after completing host onboarding and admin approval. Lists properties, manages bookings, receives weekly payouts. |
| **Admin** | Moderates listings, approves host applications, manages users, processes payout queue, views platform analytics. |

`role` stores the account type (`guest`, `host`, `admin`). `active_role` stores what the user is currently acting as (`guest` or `host`) and is embedded as a claim in the JWT. Switching roles calls `/auth/switch-role`, which re-issues the token. Switching to host mode requires `hostProfile.status = 'verified'`.

---

## Host Onboarding Flow

Standard registration creates a Guest account. To become a Host, a separate verification flow is required.

**Step 1 — Register as guest** (standard email + password signup)

**Step 2 — "Become a host" CTA** visible in the navbar for any guest without a verified host profile

**Step 3 — Host onboarding form collects:**
- Full legal name
- Phone number
- Address
- Government ID type + number (stored as text — no real verification for portfolio)
- Bank account details (fake values for test mode)
- Agreement to host terms

**Step 4 — Submission** creates a `hostProfile` record with `status: pending`

**Step 5 — Admin review** in the admin panel — admin sees a queue of pending applications, reviews submitted details, and approves or rejects

**Step 6 — On approval** `hostProfile.status` → `verified`. User can now switch to host mode and create listings. Email notification sent.

**Step 7 — On rejection** email sent with reason field from `rejection_reason`. User can resubmit after updating details.

This mirrors real-world KYC-style flows (Airbnb, Uber) and is a strong interview talking point.

---

## Platform Commission Model

StayMate takes a cut on every completed booking. The model is transparent — both guest and host see the fee breakdown before any money moves.

### Fee structure

| Fee | Who pays | Amount |
|---|---|---|
| Service fee | Guest | 5% of base price |
| Platform fee | Host (deducted from payout) | 2% of base price |

### Coupon / discount support

Coupons can be public (`isPublic: true`) or user-targeted (`userId` set). They support two discount types:
- `percent` — percentage off base price
- `flat` — fixed dollar amount off

`discountAmount` is stored on the booking at time of creation (snapshot — not recalculated later).

### Example breakdown

For a listing at **$100/night for 3 nights** with a $10 flat coupon:

| Line item | Amount |
|---|---|
| Base price (3 nights × $100) | $300.00 |
| Discount (coupon) | −$10.00 |
| Cleaning fee | $20.00 |
| Service fee (5% of base) | $15.00 |
| **Total charged to guest** | **$325.00** |
| Platform fee (2% of base, deducted from host) | −$6.00 |
| **Host net payout** | **$284.00** |

### Payment flow

1. Guest pays full amount to the platform's Stripe test account
2. `payment_intent.succeeded` webhook fires → NestJS `/payments/webhook`
3. `booking.status` → `confirmed`
4. `conversation` record created — chat unlocked
5. `booking_earnings` record created:
   - `grossAmount` = base price
   - `platformFee` = 2% of base
   - `hostAmount` = gross − platform fee
   - `status` = `unpaid`
6. Email sent to guest and host

### Weekly payout cron job

Every Monday at 9am, a scheduled job (`@Cron`) runs:

1. Fetches all `booking_earnings` with `status: unpaid` where booking is `completed`
2. Groups earnings by `hostId`
3. Creates one `payouts` record per host:
   - `totalAmount` = sum of `hostAmount` for that host
   - `periodStart` / `periodEnd` = the past week's date range
   - `status` = `pending`
4. Updates each linked `booking_earnings.status` → `in_payout`, sets `payoutId`
5. Admin sees the payout queue in the admin panel and marks each as `paid`
6. On admin marking paid: `booking_earnings.status` → `paid`

Host dashboard shows per-booking earnings and weekly payout history. Admin dashboard shows total platform fees collected.

---

## Amenities System

Amenities are stored in dedicated tables and support both system-defined and custom host-defined values.

### Amenity categories (system-seeded)

| Category | Examples |
|---|---|
| Essentials | WiFi, Air conditioning, Heating, Hot water |
| Kitchen | Full kitchen, Microwave, Refrigerator, Coffee maker |
| Bathroom | Hair dryer, Bathtub, Hot tub |
| Outdoor | Parking, Garden, BBQ grill, Pool, Beach access |
| Safety | Smoke alarm, Carbon monoxide alarm, First aid kit, Fire extinguisher |
| Work | Dedicated workspace, High-speed WiFi, Printer |
| Accessibility | Step-free access, Wide entrance, Elevator |

### Custom amenities

Hosts can type a custom amenity not in the system list. It gets saved with `isSystem: false` and linked to the listing via `amenitiesListing`. Custom amenities appear on the listing detail page but are not surfaced in the global filter panel.

### Filter behaviour

The filter panel fetches all `isSystem: true` amenities, groups them by `amenity_categories.name`, and renders checkbox groups. Selecting multiple amenities filters for listings that have **all** selected amenities (AND logic, server-side).

---

## Feature List

### Guest

**Discovery**
- Search listings by location, dates, and guest count
- Filter panel: price range, property type, amenities (grouped by category), bedrooms, bathrooms
- Map view (Leaflet + OSM) — listings as pins, click to preview
- Wishlist — save/unsave listings (`wishlists` table)

**Booking**
- Real-time availability calendar — blocked dates shown, conflicts prevented server-side
- Price breakdown before checkout: base rate, cleaning fee, service fee (5%), coupon discount, total
- Coupon code field at checkout
- Stripe Checkout (test mode) — full payment flow with test card
- Booking history — upcoming and past trips with status badges
- Cancel booking — triggers state transition, refund record in test mode

**Communication + trust**
- Real-time chat with host — available only after booking is `confirmed`
- Leave a review after checkout — star rating + text (only after `completed` status)
- Email notifications: booking confirmed, check-in reminder, booking cancelled

---

### Host

**Listing management**
- Create listing: title, description, address (geocoded to lat/lng), property type, max guests, bedrooms, bathrooms, price per night, cleaning fee, additional info
- Photo upload — multiple images, reorder by `displayOrder`, delete (stored in `/uploads`)
- Amenities picker — system amenities by category + add custom (`isSystem: false`)
- Check-in/check-out times, min/max nights
- Draft mode — `status: draft`, publish when ready
- Edit / delete listing

**Availability management**
- Block specific dates with optional reason (`availabilityBlocks`)
- Set minimum and maximum nights per booking
- Availability calendar view

**Bookings**
- Booking requests inbox — pending requests with guest details
- Accept or decline
- All reservations view — filter by status
- Real-time chat with guests — only for confirmed bookings

**Earnings**
- Host dashboard:
  - Revenue chart (by week/month)
  - Per-booking earnings: gross, platform fee deducted, net
  - Weekly payout history with `periodStart` / `periodEnd` and status
- Review guests after checkout (`host_to_guest` type)

---

### Admin

**Host verification**
- Pending `hostProfile` applications queue
- View submitted details (legal name, ID type/number, bank info)
- Approve or reject with `rejection_reason`
- Email sent to applicant on decision

**Payouts**
- Weekly payout queue — grouped by host, showing `totalAmount` and period
- Mark payout as `paid` — triggers `booking_earnings` status update
- Platform earnings summary — total `platformFee` collected

**Moderation**
- Reported content queue
- User management — suspend (`isActive: false`), reinstate, view activity

**Platform analytics**
- Total bookings, GMV, registered users, active listings
- Platform earnings over time
- Transaction log — all bookings with payment intent IDs

---

### Shared (all roles)

- Register / login — email + password, bcrypt hashed
- JWT auth — access token (15 min) + refresh token (7 days, rotated)
- Role switching — guest ↔ host toggle (requires `hostProfile.status = verified`)
- Profile page — avatar (`/uploads/avatars/:userId/`), bio, reviews received
- Password reset — email link with signed token, 1-hour expiry
- In-app notifications — new message, booking update, host application status (`notifications` table)
- Dark mode — system preference + manual toggle
- Fully responsive — mobile + desktop

---

## Database Schema (DBML)

```dbml
TablePartial base_fields {
  id uuid [primary key]
  isActive boolean [default: true]
  createdAt timestamp [default: `now()`]
  updatedAt timestamp [default: `now()`]
}

Enum user_role {
  guest
  host
  admin
}

Enum active_role {
  guest
  host
}

Enum host_status {
  pending
  verified
  rejected
}

Enum listing_status {
  draft
  active
  closed
}

Enum property_type {
  apartment
  villa
  cabin
  room
}

Enum booking_status {
  pending
  confirmed
  cancelled
  completed
  rejected
}

Enum discount_type {
  percent
  flat
}

Enum earning_status {
  unpaid
  in_payout
  paid
}

Enum payout_status {
  pending
  paid
}

Enum review_type {
  guest_to_host
  host_to_guest
}

Table users {
  ~base_fields
  name text
  email text [not null, unique]
  password_hash text [not null]
  avatar_url text
  bio text
  role user_role [not null, default: 'guest']
  active_role active_role [not null, default: 'guest']
}

Table hostProfile {
  ~base_fields
  userId uuid [not null, unique]
  legal_name text [not null]
  phone text [not null]
  address text [not null]
  id_type text [not null]
  id_number text [not null]
  bank_info text [not null]
  status host_status [not null, default: 'pending']
  rejection_reason text
  reviewed_by uuid
  submitted_at timestamp
  reviewed_at timestamp
}

Table listing {
  ~base_fields
  owned_by uuid [not null]
  title text [not null]
  description text [not null]
  price decimal
  locationText text [not null]
  latitude decimal [not null]
  longitude decimal [not null]
  maxGuests integer
  bedrooms integer
  bathrooms integer
  status listing_status [not null, default: 'draft']
  cleaningFee decimal
  propertyType property_type [not null]
  minNights integer
  maxNights integer
  checkInTime time [not null]
  checkOutTime time [not null]
  additionalInfo text
}

Table listingPhotos {
  ~base_fields
  listingId uuid [not null]
  picture text [not null]
  label text
  displayOrder integer
}

Table amenity_categories {
  ~base_fields
  name text [not null, unique]
  description text
}

Table amenities {
  ~base_fields
  name text [not null]
  icon text
  category_id uuid [not null]
  isSystem boolean [default: true]
}

Table amenitiesListing {
  id uuid [pk]
  amenitiesId uuid [not null]
  listingId uuid [not null]
}

Table availabilityBlocks {
  id uuid [pk]
  listingId uuid [not null]
  startDate timestamp [not null]
  endDate timestamp [not null]
  reason text
}

Table coupons {
  ~base_fields
  code text [not null, unique]
  discountType discount_type [not null]
  discount decimal [not null]
  expiryDate timestamp
  userId uuid [null]
  isPublic boolean [default: false]
}

Table booking {
  ~base_fields
  listingId uuid [not null]
  bookedBy uuid [not null]
  guestCount integer [not null]
  status booking_status [default: 'pending']
  baseAmount decimal [not null]
  cleaningFee decimal [not null]
  serviceFee decimal [not null]
  discountAmount decimal [not null, default: 0]
  couponId uuid [null]
  totalAmount decimal [not null]
  stripePaymentIntentId text
  checkIn timestamp [not null]
  checkOut timestamp [not null]
}

Table booking_earnings {
  id uuid [pk]
  bookingId uuid [not null, unique]
  hostId uuid [not null]
  grossAmount decimal [not null]
  platformFee decimal [not null]
  hostAmount decimal [not null]
  status earning_status [not null, default: 'unpaid']
  payoutId uuid [null]
  createdAt timestamp [default: `now()`]
}

Table payouts {
  id uuid [pk]
  hostId uuid [not null]
  totalAmount decimal [not null]
  periodStart timestamp [not null]
  periodEnd timestamp [not null]
  status payout_status [not null, default: 'pending']
  createdAt timestamp [default: `now()`]
}

Table reviews {
  ~base_fields
  bookingId uuid [not null]
  reviewerId uuid [not null]
  revieweeId uuid [not null]
  rating integer [not null]
  comment text
  type review_type [not null]
}

Table conversations {
  id uuid [pk]
  bookingId uuid [not null, unique]
  guestId uuid [not null]
  hostId uuid [not null]
  createdAt timestamp [default: `now()`]
}

Table messages {
  id uuid [pk]
  conversationId uuid [not null]
  senderId uuid [not null]
  content text [not null]
  readAt timestamp
  createdAt timestamp [default: `now()`]
}

Table notifications {
  id uuid [pk]
  userId uuid [not null]
  type text [not null]
  payload jsonb
  readAt timestamp
  createdAt timestamp [default: `now()`]
}

Table wishlists {
  id uuid [pk]
  userId uuid [not null]
  listingId uuid [not null]
  createdAt timestamp [default: `now()`]
}

// Users
Ref: users.id < hostProfile.userId
Ref: users.id < hostProfile.reviewed_by
Ref: users.id < listing.owned_by
Ref: users.id < booking.bookedBy
Ref: users.id < booking_earnings.hostId
Ref: users.id < payouts.hostId
Ref: users.id < reviews.reviewerId
Ref: users.id < reviews.revieweeId
Ref: users.id < conversations.guestId
Ref: users.id < conversations.hostId
Ref: users.id < messages.senderId
Ref: users.id < notifications.userId
Ref: users.id < wishlists.userId

// Listings
Ref: listing.id < listingPhotos.listingId
Ref: listing.id < amenitiesListing.listingId
Ref: listing.id < availabilityBlocks.listingId
Ref: listing.id < booking.listingId
Ref: listing.id < wishlists.listingId

// Amenities
Ref: amenity_categories.id < amenities.category_id
Ref: amenities.id < amenitiesListing.amenitiesId

// Bookings
Ref: coupons.id < booking.couponId
Ref: booking.id < booking_earnings.bookingId
Ref: booking.id - conversations.bookingId
Ref: booking.id < reviews.bookingId

// Earnings & Payouts
Ref: payouts.id < booking_earnings.payoutId

// Conversations
Ref: conversations.id < messages.conversationId
```

---

## NestJS Module Structure

```
src/
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts        # /register, /login, /refresh, /logout, /switch-role, /reset-password
│   ├── auth.service.ts
│   ├── strategies/
│   │   └── jwt.strategy.ts
│   └── guards/
│       ├── jwt-auth.guard.ts
│       ├── roles.guard.ts        # checks active_role JWT claim
│       └── admin.guard.ts        # checks role = admin
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts       # GET /me, PATCH profile, POST avatar
│   └── users.service.ts
│
├── host-profiles/
│   ├── host-profiles.module.ts
│   ├── host-profiles.controller.ts  # POST /apply, GET /status
│   └── host-profiles.service.ts
│
├── listings/
│   ├── listings.module.ts
│   ├── listings.controller.ts    # CRUD, photo upload, search + filters
│   └── listings.service.ts
│
├── amenities/
│   ├── amenities.module.ts
│   ├── amenities.controller.ts   # GET /amenities (grouped by category), POST custom
│   └── amenities.service.ts
│
├── availability/
│   ├── availability.module.ts
│   ├── availability.controller.ts
│   └── availability.service.ts   # block dates, conflict checks
│
├── bookings/
│   ├── bookings.module.ts
│   ├── bookings.controller.ts
│   ├── bookings.service.ts       # state machine, coupon application
│   └── booking-state.machine.ts  # explicit transition methods
│
├── payments/
│   ├── payments.module.ts
│   ├── payments.controller.ts    # POST /create-checkout, POST /webhook (raw body)
│   └── payments.service.ts       # Stripe SDK, fee calc, booking_earnings creation
│
├── payouts/
│   ├── payouts.module.ts
│   ├── payouts.controller.ts     # GET host payout history
│   ├── payouts.service.ts        # payout aggregation, mark as paid
│   └── payouts.cron.ts           # @Cron every Monday 9am — weekly payout generation
│
├── coupons/
│   ├── coupons.module.ts
│   ├── coupons.controller.ts     # POST /validate, admin CRUD
│   └── coupons.service.ts
│
├── messages/
│   ├── messages.module.ts
│   ├── messages.controller.ts    # GET conversation history
│   ├── messages.service.ts
│   └── messages.gateway.ts       # Socket.io gateway, rooms by bookingId
│
├── reviews/
│   ├── reviews.module.ts
│   ├── reviews.controller.ts
│   └── reviews.service.ts
│
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts  # create, mark read
│   └── email.service.ts          # Nodemailer dispatch
│
├── wishlists/
│   ├── wishlists.module.ts
│   ├── wishlists.controller.ts   # POST /toggle, GET /my
│   └── wishlists.service.ts
│
├── admin/
│   ├── admin.module.ts
│   ├── admin.controller.ts       # host approvals, payout queue, analytics, moderation
│   └── admin.service.ts
│
└── common/
    ├── decorators/               # @CurrentUser(), @Roles(), @IsAdmin()
    ├── interceptors/             # logging, response transform
    ├── filters/                  # global exception filter
    ├── pipes/                    # global validation pipe
    └── entities/                 # BaseEntity (id, isActive, createdAt, updatedAt)
```

---

## Booking State Machine

```
[Guest pays → Stripe Checkout]
          │
          ▼
       PENDING ──── host declines ──────────────▶ REJECTED
          │                                       (Stripe payment intent cancelled)
          │
     host accepts
     + payment_intent.succeeded
     webhook confirmed
          │
          ▼
     CONFIRMED ──── guest cancels ─────────────▶ CANCELLED
          │                                       (refund record, earning voided)
          │
     check-out date passes
     (@Cron daily check)
          │
          ▼
      COMPLETED
   (review window opens,
    booking_earning.status → unpaid,
    eligible for next weekly payout)
```

Transitions are explicit methods on `BookingsService`. Each transition validates the current state before proceeding — never a direct field update.

---

## Weekly Payout Flow

```
Every Monday 9am — @Cron fires
          │
          ▼
Fetch all booking_earnings WHERE status = 'unpaid'
AND booking.status = 'completed'
          │
          ▼
Group by hostId
          │
          ▼
For each host:
  CREATE payouts {
    hostId, totalAmount (sum),
    periodStart, periodEnd,
    status: 'pending'
  }
  UPDATE booking_earnings SET
    status = 'in_payout',
    payoutId = <new payout id>
          │
          ▼
Admin reviews payout queue
→ clicks "Mark as paid"
          │
          ▼
UPDATE payouts SET status = 'paid'
UPDATE booking_earnings SET status = 'paid'
```

---

## Map Strategy

| Purpose | Tool | Cost | Notes |
|---|---|---|---|
| Map display | Leaflet + OpenStreetMap | Free forever | No API key, no signup |
| Geocoding | Nominatim (OSM) | Free | 1 req/sec — fine for portfolio |
| Optional upgrade | MapTiler | Free (100k loads/mo) | No credit card, nicer map styles |

Listings store `latitude` and `longitude`. Search filters by bounding box server-side (PostgreSQL range query). Map pins render client-side via Leaflet markers.

---

## Image Storage

Images stored locally in `/uploads`, served as static files by NestJS via `ServeStaticModule`.

**Listing photos:**
1. Host submits multipart form with photos
2. NestJS `FilesInterceptor` (Multer) saves to `/uploads/listings/:listingId/`
3. File path + `displayOrder` stored in `listingPhotos` table
4. Served at `GET /uploads/listings/:listingId/filename.jpg`

**Avatar upload:** saved to `/uploads/avatars/:userId/`, path stored in `users.avatar_url`

---

## Project Timeline

### Phase 1 — Foundation (weeks 1–3)
- NestJS setup: TypeORM, modules, global exception filter, validation pipe, Swagger
- PostgreSQL schema + migrations + seed (amenity categories, amenities, admin user, sample listings)
- Auth: register, login, JWT + refresh token rotation, password reset, role switching
- Host onboarding: application form, `hostProfile` entity, admin approval queue
- React + Vite setup: Tailwind, routing, auth context, protected routes
- Listing CRUD with photo upload (Multer, local storage)
- Amenities system: seeded categories, custom amenity creation, filter grouping

### Phase 2 — Booking engine + payments (weeks 4–7)
- Availability calendar — date blocking, server-side conflict checks
- Coupon system — validate code, apply discount, snapshot `discountAmount`
- Booking creation — full price breakdown (base + cleaning + service fee − discount)
- Booking state machine — pending → confirmed → cancelled/rejected → completed
- Stripe Checkout (test mode) — create payment intent, session
- Stripe webhook handler → state transition + `booking_earnings` creation
- `@nestjs/schedule` setup — weekly payout cron job
- Email notifications (Nodemailer) — booking confirmed, host alert, payout processed
- Map search — Leaflet + OSM, bounding box filter, listing pins
- Filter panel — amenities grouped by category, price range, dates, guests

### Phase 3 — Wow features + polish (weeks 8–12)
- Socket.io messaging gateway — rooms by `bookingId`, read receipts
- Chat UI — conversation list, message thread, unread badge in navbar
- Reviews — post-checkout only, mutual guest ↔ host
- Wishlists — save/unsave listings
- Host dashboard — revenue chart, per-booking earnings, weekly payout history
- Admin panel — host approval queue, payout queue, platform earnings, moderation
- In-app notifications — bell icon, mark as read
- Docker + Docker Compose (Postgres + Redis + API + React)
- GitHub Actions CI — lint + test on PR
- Deploy to Railway / Fly.io
- Jest unit tests — booking state machine, fee calculation, payout cron, auth
- README with demo walkthrough, test credentials, Stripe test card

---

## Recruiter Demo Script

Six moments to walk through with any recruiter:

1. **Host onboarding** — "Registering as a guest is instant. To become a host you submit a verification form — legal name, ID, bank details. It sits in the admin queue until approved. Mirrors real KYC flows."

2. **Booking + webhook flow** — "Guest applies a coupon, pays with test card `4242...`. The `payment_intent.succeeded` webhook fires asynchronously, transitions the booking to confirmed, creates a `booking_earnings` record with the 2% platform fee already deducted, and unlocks the chat."

3. **Weekly payout cron** — "Every Monday a scheduled job groups all unpaid earnings by host, creates one payout record per host with a period range, and puts it in the admin queue. Admin marks it paid. Host sees their net payout history in the dashboard."

4. **Amenities + filters** — "Amenities are categorised — system-seeded plus custom host-defined ones. The filter panel fetches all system amenities grouped by category and filters with AND logic server-side."

5. **Chat** — "Messaging only unlocks after a booking is confirmed — the Socket.io room ID is the `bookingId`. Only that guest and host can join. Read receipts via `readAt` timestamp."

6. **Commission model** — "Guest pays 5% service fee. Host absorbs 2% platform fee — deducted from their `booking_earning`, visible in their dashboard. Admin sees total platform revenue separately."

---

## What Makes This Different From a Typical Clone

| Most clones | StayMate |
|---|---|
| Boolean `isPaid` field | Full booking state machine with explicit transitions |
| Direct API call for payment | Stripe webhook → async state update + earnings record |
| No commission logic | Platform cut calculated per booking, batched into weekly payouts |
| Hardcoded amenities | Categorised system amenities + custom host-defined ones |
| No real-time | Socket.io chat scoped to confirmed bookings only |
| Single user type | Guest / host role switching via JWT claims + RBAC guards |
| Open host registration | KYC-style host onboarding with admin approval queue |
| No scheduling | Weekly payout cron via `@nestjs/schedule` |
| No coupon system | Percent + flat coupons, public or user-targeted |
| No deployment | Dockerised, deployed, CI/CD on GitHub Actions |
| No tests | Jest unit + e2e on critical paths |

---

*Last updated: May 2026*
