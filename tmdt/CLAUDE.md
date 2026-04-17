# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Framework constraints

- This project runs on **Next.js 16.2.3** + React 19.
- There is an explicit project rule in `AGENTS.md`: treat this as potentially breaking from older Next.js conventions and check docs under `node_modules/next/dist/docs/` before framework-level changes.

## Working directory

- Run commands from `tmdt/`.

## Execution authorization

- Repository owner explicitly authorizes Claude Code to complete BMAD stories end-to-end in this repo (implement code, update tests, and sync story/sprint artifacts).
- For normal local development work, proceed autonomously without asking for extra confirmation each step.
- Still require explicit confirmation for high-risk/destructive or external actions (e.g. force push, deleting branches/files, changing remote resources).

## Commands

- Install deps: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Production start: `npm run start`
- Lint: `npm run lint`

### Tests (Node test runner)

- Run all tests: `node --test src/**/*.test.js`
- Run one test file: `node --test src/app/api/checkout/route.test.js`
- Run one test by name: `node --test --test-name-pattern "checkout route GET trả draft hợp lệ" src/app/api/checkout/route.test.js`

## Architecture overview

### 1) App layer (Next App Router)

- UI routes are in `src/app/**/page.tsx` with route groups `(auth)`, `(public)`, `(customer)`.
- HTTP APIs are in `src/app/api/**/route.js` and are thin adapters: validate input, enforce auth/role, call module services, map status codes.

### 2) Domain/services layer

- Core business logic lives in `src/modules/*`:
  - `identity`: auth, sessions, role checks, profile/account status
  - `catalog`: product listing/detail and filtering
  - `cart`: item hydrate/validate against catalog stock
  - `checkout`: checkout draft assembly + shipping/pricing
  - `order`: order creation and payment lifecycle orchestration
  - `payment`: payment init/callback/idempotency/retry
  - `tryon` + `recommendation`: AI try-on processing and recommendation ranking
  - `integrations/*`: external adapter boundaries (AI try-on, payment provider)

### 3) Persistence model

- Most stores are file-backed JSON under `.data/` (users, carts, orders, payments) with in-process write serialization queues in each store module.
- Auth sessions are **in-memory Map** (`src/modules/identity/session-store.js`) with 7-day TTL; sessions are not persisted across process restarts.
- Catalog is currently seeded in-memory (`src/modules/catalog/product-store.js`).

### 4) End-to-end business flows

- **Auth/RBAC**
  - Login sets `session_token` + signed `session_role` cookies.
  - API role checks use `requireApiRole(...)` from `src/modules/identity/authorization.js`.
- **Checkout/Order/Payment**
  - `placeOrder` in `src/modules/order/order-service.js` gates via checkout draft, initializes payment, creates order, then clears cart.
  - Payment webhook (`src/app/api/webhooks/payment/route.js`) verifies HMAC (`PAYMENT_WEBHOOK_SECRET`) and reconciles both payment transaction + order status.
  - Callback idempotency is tracked via `processedIdempotencyKeys` in payment transactions.
- **Try-on/Recommendations**
  - Try-on results are saved per session via try-on session service and reused as personalization signals in recommendations.

### 5) API/response conventions

- API responses consistently include `X-Correlation-Id`.
- Common response envelope pattern is `{ success, state, data | error, message }`.
- Error-code-first mapping is used heavily (e.g. `AUTH_*`, `CHECKOUT_*`, `PAYMENT_*`, `ORDER_*`).

## Config notes

- TS path alias: `@/* -> src/*` (`tsconfig.json`).
- `allowJs: true` is enabled; service and route modules are mostly `.js`.
- `next.config.ts` enables `reactCompiler: true`.

## Environment variables used by current implementation

- `SESSION_COOKIE_SECRET` (signing `session_role` cookie)
- `PAYMENT_WEBHOOK_SECRET` (payment webhook signature verification)
- `TRYON_TIMEOUT_MS` (capped to 30000ms in route/service logic)

## BMAD artifacts in repo

- Planning artifacts: `_bmad-output/planning-artifacts/`
- Implementation/story artifacts: `_bmad-output/implementation-artifacts/`
- Sprint tracker: `_bmad-output/implementation-artifacts/sprint-status.yaml`

When working through BMAD story flows, keep story status and sprint status aligned.