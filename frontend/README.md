# StayMate Frontend

React client for the StayMate rental marketplace. This app covers guest discovery and booking, host listing management, admin workflows, role switching, notifications, and realtime messaging.

## Stack

- React 19
- Vite
- TanStack Router
- TanStack Query
- Zustand
- Tailwind CSS
- Stripe Elements
- Socket.IO client
- Leaflet
- Vitest

## What the frontend includes

- landing page and listing discovery
- listing details with booking sidebar
- Stripe checkout and booking confirmation screens
- auth flows: register, login, forgot password, reset password
- guest dashboard: trips, saved listings, messages
- host onboarding flow with multi-step verification form
- host dashboard: listings, reservations, earnings, reviews, messages
- admin dashboard: host approvals, hosts, coupons, payouts, finance, listing bookings

## Project structure

```text
src/
|-- components/      # shared UI, layouts, and small reusable pieces
|-- features/        # domain-oriented feature modules
|   |-- admin/
|   |-- auth/
|   |-- bookings/
|   |-- checkout/
|   |-- host-dashboard/
|   |-- host-onboarding/
|   |-- listings/
|   |-- messages/
|   |-- notifications/
|   |-- reviews/
|   `-- wishlists/
|-- lib/             # axios client, query client, env URL helpers, Stripe setup
|-- routes/          # file-based TanStack Router routes
|-- styles.css
`-- main.tsx
```

## Local setup

### Prerequisites

- Node.js 20+
- pnpm
- running StayMate backend on `http://localhost:3000`

### Environment variables

Create `frontend/.env.local`:

```env
BE_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Notes:

- `BE_URL` is allowed because Vite is configured with `envPrefix: ['VITE_', 'BE_']`.
- API requests are sent to `${BE_URL}/api/v1`.

### Run the app

```bash
pnpm install
pnpm dev
```

Default local URL: `http://localhost:3005`

## Scripts

```bash
pnpm dev
pnpm build
pnpm preview
pnpm test
pnpm lint
pnpm format
pnpm check
```

## Routing model

The app uses file-based routing. The most important route groups are:

- public routes: `/`, `/listings`, `/listings/$listingId`
- auth routes: `/login`, `/register`, `/forgot-password`, `/reset-password`
- guest routes: `/guest/*`
- host routes: `/host/*`
- admin routes: `/admin/*`
- checkout and booking confirmation routes

This structure makes role-focused product areas easy to review in interviews and simple to expand without central route config churn.

## Client architecture

### Data access

- `src/lib/api/client.ts` configures a shared axios client.
- Access tokens are attached from Zustand auth state.
- A 401 response triggers an automatic refresh request and retries the original call.
- TanStack Query manages caching and request lifecycle behavior.

### Feature boundaries

Each feature owns its API layer, types, and screen components. That keeps domain behavior close together and prevents route files from becoming orchestration-heavy.

### Checkout

- Stripe Elements is initialized in `src/lib/stripe.ts`.
- Backend checkout session creation and booking verification live in the checkout feature.

### Messaging

- Socket connectivity lives in `features/messages/hooks/use-messages-socket.ts`.
- Realtime chat is scoped to authenticated users and confirmed-booking conversations.

### Maps and search

- Leaflet is used for listing location display.
- Search UI components live under shared and listings-specific feature folders.

## UI approach

- shared primitives are under `src/components/ui`
- higher-level layouts live under `src/components/layouts`
- feature screens stay inside their domain folders rather than a global pages directory

This split reads better in code review than a flat component tree and matches how product teams usually scale React apps.

## Testing

- frontend tests run with Vitest
- auth schema validation already includes a test file
- run `pnpm test` for the current suite

## Current engineering notes

- The app assumes the backend is running with credentials-enabled CORS from `http://localhost:3005`.
- API base URL generation is centralized in `src/lib/api/urls.ts`, so environment mismatches usually show up quickly.
- The repo still contains one backup file, `src/features/home/old-index.bak.tsx`, which should not be treated as active app code.
