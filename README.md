# orders-console
A full-stack Orders Console built with React, Node.js, and a real database, featuring server-side filtering, pagination, and duplicate-safe order creation.

## Getting started

Requires Node.js 20.12+ (developed on Node 24). No database server to install — SQLite runs in-process and stores its data in `server/data/orders.db`.

```bash
npm install          # installs both workspaces (client + server)
npm run db:seed      # creates the schema and seeds 50,000 orders + 2 users (~5s, resets existing data)
npm run dev          # API on http://localhost:4000, UI on http://localhost:5173
npm test             # R2 proof: duplicate create requests produce exactly one order
```

`npm test` seeds a throwaway database, starts **two** API processes on it, and fires the same create request at both at once (2× and 20×), then checks the database holds exactly one order. Two processes rule out the guarantee coming from Node running one request at a time. It also covers sequential retries, a key reused with different details (422), and requests without a valid key (400).

To see the rapid-filter behaviour (R1), run the API with random latency so responses arrive out of order: `SIMULATED_LATENCY_MS=1500 npm run dev` (PowerShell: `$env:SIMULATED_LATENCY_MS=1500; npm run dev`).

`npm run db:seed -- --orders=200000` seeds a different number of orders. The data is deterministic: every run produces the same orders.

### Seeded users

| Role  | Email                | Password     |
| ----- | -------------------- | ------------ |
| admin | `admin@orders.local` | `Admin#2026` |
| agent | `agent@orders.local` | `Agent#2026` |

Sign-in sessions end when the API restarts unless `JWT_SECRET` is set (see `server/.env.example`).

Optional: copy `server/.env.example` to `server/.env` (and `client/.env.example` to `client/.env`) to override the defaults.

## Project structure

```
client/               React 18+ · Vite · TypeScript
  src/api/            HTTP calls to the back end
  src/features/       Screens and their hooks (auth, orders)
  src/lib/            Small shared helpers
server/               Node · Express · TypeScript
  src/config/         Environment loading and validation
  src/auth/           Login, session tokens, auth middleware, password hashing
  src/db/             SQLite connection, migrations, seed script
  src/orders/         Orders API: validation, queries, routes
  src/middleware/     Cross-cutting Express middleware
  src/routes/         HTTP route handlers
```

## Code review: the contractor's auth middleware

Every problem I found in the `auth.ts` / `routes.ts` snippet from the brief, and what replaced it. The fixed code lives in [`server/src/auth/`](server/src/auth/) and [`server/src/orders/orders.routes.ts`](server/src/orders/orders.routes.ts).

| # | Problem | Why it matters | What I changed |
| - | ------- | -------------- | -------------- |
| 1 | `jwt.decode` instead of `jwt.verify` | The signature is never checked: anyone can hand-write a token saying `"role": "admin"` and be an admin. | `jwt.verify`, with the algorithm pinned to HS256 ([token.ts](server/src/auth/token.ts)). |
| 2 | Secret hard-coded in source | Anyone who has the repo (or the brief) can sign valid tokens. | `JWT_SECRET` from the environment, at least 32 characters, required in production. In development an unset secret becomes a random one per run, so there is no default to leak. |
| 3 | Token accepted from `?token=` | URLs are written to server and proxy logs, browser history and `Referer` headers. | The token is read from an httpOnly cookie only. |
| 4 | No expiry | `jwt.sign` sets no `expiresIn`, and `decode` ignores `exp` anyway: a leaked token works forever. | Sessions expire after `SESSION_TTL_HOURS` (default 8), enforced by `verify`. |
| 5 | Admin check only in the React `AdminOnly` component | Hiding a button is cosmetic; any agent can call `DELETE /orders/:id` with curl. | `requireRole("admin")` on the server ([auth.middleware.ts](server/src/auth/auth.middleware.ts)). |
| 6 | Plain-text passwords, compared inside the query | One database leak exposes every password. | Salted scrypt hashes with a constant-time comparison ([password.ts](server/src/auth/password.ts)). |
| 7 | Login body not validated | `email` can arrive as an object, such as `{"not": ""}` for Prisma or `{"$ne": null}` for MongoDB, and log in without a password. | zod accepts only strings: email format, length limits, 400 otherwise. |
| 8 | No brute-force protection | Unlimited password guesses. | 10 failed attempts per 15 minutes per IP, then 429 ([auth.routes.ts](server/src/auth/auth.routes.ts)). |
| 9 | Role baked into the token | A demoted or deleted user keeps their access until the token expires, which here is never. | The token carries only the user id; the user and role are loaded from the database on every request. |
| 10 | Delete route trusts `req.params.id` and always answers `ok` | `DELETE /orders/abc` reaches the ORM; a missing order still reports success; in Express 4 a rejected `await` leaves the request hanging. | Id validated (400), 404 when nothing was deleted, Express 5 forwards async errors to the error handler. |
| 11 | `req.user = payload` is untyped | Whatever the token decodes to flows through the app unchecked. | A typed `Request.user` ([express.d.ts](server/src/types/express.d.ts)), set only from a database row. |
| 12 | Each route must remember to add `requireAuth` | One forgotten middleware exposes a route. | `ordersRouter.use(requireAuth)` protects every orders route, including future ones. |

While fixing #6 I also closed a timing leak: hashing a password takes ~50 ms, so answering instantly for unknown emails would reveal which emails have accounts. Unknown emails are compared against a dummy hash, so both paths take the same time and return the same message.

### Where the token lives on the client

The session token is in an httpOnly, `SameSite=Strict` cookie scoped to `/api` (and `Secure` in production). Page JavaScript cannot read it, so an XSS bug cannot steal the token and replay it from elsewhere, and other sites cannot make the browser send it (CSRF). It does not protect against XSS itself: a script injected into our page can still call the API as the user while the tab is open, so that has to be prevented at the source (React's escaping, no `dangerouslySetInnerHTML`, a Content Security Policy).
