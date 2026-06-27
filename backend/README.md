# StayMate Backend

NestJS API for the StayMate rental marketplace. This service owns authentication, listings, availability, bookings, coupons, payments, payouts, messaging, notifications, reviews, wishlists, and admin operations.

## Responsibilities

- expose the REST API under `/api/v1`
- serve Swagger docs for API inspection
- persist marketplace state in PostgreSQL
- issue and refresh JWT-based auth sessions
- create Stripe checkout sessions and process webhook callbacks
- power real-time messaging via Socket.IO
- seed recruiter-friendly demo data for local review

## Stack

- NestJS 11
- TypeScript
- PostgreSQL
- TypeORM
- JWT + Passport
- Stripe
- Socket.IO
- Swagger
- Jest + Supertest

## Project structure

```text
src/
|-- common/          # guards, decorators, filters, interceptors, base entity
|-- config/          # env validation and Stripe config
|-- database/        # seed scripts and demo assets
|-- modules/
|   |-- admin/
|   |-- amenities/
|   |-- auth/
|   |-- availability/
|   |-- bookings/
|   |-- coupons/
|   |-- host-profiles/
|   |-- listings/
|   |-- messages/
|   |-- notifications/
|   |-- payments/
|   |-- payouts/
|   |-- reviews/
|   |-- users/
|   `-- wishlists/
|-- app.module.ts
`-- main.ts
```

## Local setup

### Prerequisites

- Node.js 20+
- pnpm
- Docker Desktop or a local PostgreSQL instance
- Stripe test credentials

### Database

Start PostgreSQL from this directory:

```bash
docker compose up -d
```

The included compose file starts PostgreSQL 17 on `localhost:5433` with:

- database: `stay-mate`
- username: `admin`
- password: `admin`

### Environment variables

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

These variables are validated at startup in `src/config/env.validation.ts`.

### Run the service

```bash
pnpm install
pnpm db:seed
pnpm start:dev
```

Runtime endpoints:

- API base: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/test/docs`
- uploaded assets: `http://localhost:3000/uploads/...`
- Socket.IO namespace: `ws://localhost:3000/messages`

## Demo data

`pnpm db:seed` creates:

- admin user: `admin@staymate.com` / `admin123`
- verified host users:
  - `alice@staymate.com` / `host123`
  - `bob@staymate.com` / `host123`
  - `charlie@staymate.com` / `host123`
- amenity categories and system amenities
- 35 active listings with seeded photos

`pnpm db:seed:bookings` adds booking and earnings records after guest accounts exist.

## Scripts

```bash
pnpm start
pnpm start:dev
pnpm start:prod
pnpm build
pnpm lint
pnpm test
pnpm test:e2e
pnpm test:cov
pnpm db:seed
pnpm db:seed:bookings
```

## Key implementation details

### Auth and session model

- Access tokens are sent in the `Authorization` header.
- Refresh flow is cookie-based and supported by the frontend axios interceptor.
- Role-sensitive behavior is enforced with JWT guards and role decorators.

### Booking and payment flow

- Checkout is created through the `payments` module using Stripe test mode.
- The Nest app is started with `rawBody: true` so Stripe webhooks can be verified safely.
- Booking confirmation is driven by webhook processing rather than optimistic client-side status changes.

### Messaging

- Socket.IO is mounted at the `/messages` namespace.
- Clients authenticate with a bearer token during the socket handshake.
- Conversation rooms are keyed by conversation ID.

### File handling

- Listing photos and avatars are served from the local `uploads/` directory.
- Static assets are mounted through `useStaticAssets(..., { prefix: '/uploads' })`.

## Testing

- Unit tests cover several domain services, including auth, reviews, messaging, notifications, and wishlists.
- E2E coverage is wired through `test/jest-e2e.json`.
- Run `pnpm test:e2e` after the database and env config are available.

## Current engineering notes

- TypeORM `synchronize` is enabled outside production. Good for rapid iteration, but migrations should replace it before a real deployment.
- CORS is currently hardcoded to `http://localhost:3005` in `main.ts`.
- Swagger is mounted at `/test/docs`; renaming this to `/docs` would be a reasonable polish step.
