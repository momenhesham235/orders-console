# orders-console
A full-stack Orders Console built with React, Node.js, and a real database, featuring server-side filtering, pagination, and duplicate-safe order creation.

## Getting started

Requires Node.js 20.12+ (developed on Node 24). No database server to install — SQLite runs in-process and stores its data in `server/data/orders.db`.

```bash
npm install          # installs both workspaces (client + server)
npm run db:migrate   # creates the schema (also runs automatically on server start)
npm run dev          # API on http://localhost:4000, UI on http://localhost:5173
```

Optional: copy `server/.env.example` to `server/.env` (and `client/.env.example` to `client/.env`) to override the defaults.

## Project structure

```
client/               React 18+ · Vite · TypeScript
  src/api/            HTTP calls to the back end
server/               Node · Express · TypeScript
  src/config/         Environment loading and validation
  src/db/             SQLite connection, migrations
  src/routes/         HTTP route handlers
```
