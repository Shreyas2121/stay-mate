# StayMate

StayMate is a full-stack rental marketplace built as a portfolio project to demonstrate senior-level product engineering across booking flows, payments, role-based access, real-time messaging, and admin operations.

The repo is intentionally split into two independently runnable apps:

- `backend/`: NestJS API, PostgreSQL integration, Stripe checkout/webhooks, Socket.IO messaging, seeding, and admin/host business logic
- `frontend/`: React + TanStack Start client for discovery, booking, host workflows, admin workflows, and realtime chat

## Why this project exists

This is not a generic CRUD clone. The project is designed to show:

- end-to-end product thinking across guest, host, and admin experiences
- backend modeling for booking lifecycle, payouts, coupons, and verification flows
- frontend architecture using route-driven screens, feature modules, and server integration patterns
- integration work with Stripe, Socket.IO, uploads, and geospatial listing discovery

## Core product flows

- Guests can browse listings, inspect details, save properties, and complete checkout with Stripe test mode.
- Hosts can apply for verification, switch into host mode, create listings, manage availability, and review earnings.
- Admins can review host applications, manage coupons, inspect listing bookings, and process payouts.
- Confirmed bookings unlock conversation-based chat between guest and host.

## Architecture at a glance

### Backend

- NestJS 11 with modular domain boundaries under `src/modules`
- PostgreSQL via TypeORM entities
- JWT auth with refresh flow and role-aware guards
- Stripe checkout session creation plus webhook-driven booking confirmation
- Socket.IO namespace for authenticated messaging
- Swagger docs exposed from the running API

### Frontend

- React 19 + Vite + TanStack Router
- TanStack Query for server state
- Zustand for auth/session state
- Tailwind CSS + shadcn-style UI primitives
- Leaflet for listing map views
- Stripe Elements for checkout

## Repo layout

```text
stay-mate/
|-- backend/
|   |-- src/
|   |   |-- modules/
|   |   |-- common/
|   |   |-- config/
|   |   `-- database/
|   `-- README.md
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- features/
|   |   |-- lib/
|   |   `-- routes/
|   `-- README.md
`-- README.md
```

## Quick start

There is no root workspace install. Run the backend and frontend separately.

### 1. Start PostgreSQL

From `backend/`:

```bash
docker compose up -d
```

This exposes PostgreSQL on `localhost:5433`.

### 2. Configure and start the backend

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=admin
DB_PASSWORD=admin
DB_NAME=stay-mate
JWT_SECRET=replace-with-a-long-random-string
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
FRONTEND_URL=http://localhost:3005
```

Then run:

```bash
cd backend
pnpm install
pnpm db:seed
pnpm start:dev
```

API base URL: `http://localhost:3000/api/v1`  
Swagger docs: `http://localhost:3000/test/docs`

### 3. Configure and start the frontend

Create `frontend/.env.local`:

```env
BE_URL=http://localhost:3000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

Then run:

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend URL: `http://localhost:3005`

## Demo data

`pnpm db:seed` creates:

- one admin user: `admin@staymate.com` / `admin123`
- three verified host users:
  - `alice@staymate.com` / `host123`
  - `bob@staymate.com` / `host123`
  - `charlie@staymate.com` / `host123`
- amenity categories and system amenities
- 35 active listings with seeded images

`pnpm db:seed:bookings` seeds booking and payment records, but it expects guest users to exist first.

## Documentation map

- Root README: recruiter-facing overview, architecture, and quick start
- `backend/README.md`: backend runtime, env vars, modules, scripts, and integration details
- `frontend/README.md`: frontend architecture, routes, env vars, and UI/data-flow details

## Notes for reviewers

- The backend currently uses TypeORM `synchronize` outside production instead of migrations.
- API docs are mounted at `/test/docs`, which is functional but should be renamed for production polish.
- CORS and Socket.IO origins are currently aligned to the local frontend on `http://localhost:3005`.
