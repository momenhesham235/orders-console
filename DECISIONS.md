# Decisions

Three decisions, each with the alternative I seriously considered and why I rejected it. AI use is at the end.

## 1. R2 — no duplicate orders: a per-user Idempotency-Key enforced by a unique index

**Decision.** The form generates one UUID per order being entered and sends it as `Idempotency-Key` on every attempt, including automatic retries after a timeout or network error. The server requires the header and inserts with `INSERT … ON CONFLICT DO NOTHING RETURNING id` inside `BEGIN IMMEDIATE`, against a unique index on `(created_by, idempotency_key)`. The database therefore accepts exactly one row per key however the requests race. A repeat with the same body gets the original order back (200); the same key with a different body is rejected (422). `npm test` proves it with two API processes on one database, receiving 2 and then 20 identical requests at once.

**Alternative: detect duplicates by content** (same customer and items within a few minutes).

**Why I rejected it.** It guesses. It blocks a customer who really does order the same thing twice, and it misses a retry that arrives after the window. A key states intent exactly: "this is the same attempt".

**Limits.**
- The key covers retries of one entry, not an agent who abandons the form and re-types the same order (a new form means a new key). After an ambiguous failure, the discard prompt tells them to check the list first.
- Deleting an order frees its key.
- Keys never expire. That is fine here; at scale they would need a TTL.

## 2. Search — FTS5 trigram index, with an escaped `LIKE` for 1–2 characters

**Decision.** Terms of 3 or more characters use an FTS5 trigram index over customer name and email. It is an external-content table kept in sync by triggers. Shorter terms use `LIKE '%term%'` with `%`, `_` and `!` escaped. Both paths match "contains", so results never change behaviour at the third keystroke; a test walked every page of 11 search cases against an independent JavaScript filter.

**Alternative:** a 3-character minimum (my first version), or `LIKE` everywhere.

**Why I rejected it.** A minimum length makes the UX bend to an index limitation. `LIKE` everywhere scans the table whenever a term is rare. Measured on 50k rows:
- FTS search plus sort: about 5 ms.
- Short-term `LIKE`: about 0.3 ms typically, because the scan stops once a page is full. Worst case is about 35–60 ms (a rare 2-character term with no matches).

The cost I accepted: the seed suspends the triggers and rebuilds the index once (23.6 s → ~4 s).

## 3. Data fetching — TanStack Query, so a stale response cannot reach the screen

**Decision.** The list uses `useInfiniteQuery` keyed by the filter set. The `AbortSignal` is passed to `fetch`, and the table remounts per filter set.

**Alternative:** a hand-rolled hook built from `useEffect`, an `AbortController` and a request-id check.

**Why I rejected it.** It is correct only if every branch is right: abort, ignore stale results, pagination state, retries, and caching when filters are toggled back and forth. TanStack Query makes the R1 guarantee structural rather than procedural. Every response is stored under the filters that requested it, and the screen reads only the current filters' entry, so a slow earlier response lands in an entry nobody is reading. Abandoned requests are also aborted. The cost is a dependency, and having to explain the mechanism instead of pointing at an `if`.

## Other choices, briefly

- **Keyset pagination, not OFFSET.** A `(sort value, id)` cursor on composite indexes makes page 500 cost the same as page 1 (~3 ms). OFFSET slows down with depth and skips or repeats rows when new orders arrive.
- **SQLite.** No install and runs in under five minutes, which the brief requires. The trade-off is a single writer on one machine; that is fine here, but it is the first thing to revisit at scale.
- **Session token in an httpOnly cookie.** See the README for what that does and does not protect against.

## How I used AI

I used Claude Code (Anthropic) as a pair programmer throughout. It scaffolded the project, drafted much of the implementation and the tests, ran the measurements (query plans, timings, page-by-page comparisons) and drafted these documents. I wrote and changed parts myself, and I reviewed every change, ran it and made every commit.

The decisions above were mine. Examples where I steered:
- Choosing the idempotency key over content matching.
- FTS5 over plain `LIKE`.
- Dropping the 3-character search minimum for the `LIKE` fallback.
- TanStack Query and virtualised scrolling.
- An httpOnly cookie for the token.
- Moving the create form into a modal, with autofocus and a discard confirmation.
