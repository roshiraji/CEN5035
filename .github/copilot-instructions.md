## CloudSchedule — Copilot instructions

This repo contains two cooperating apps: `cloudschedule-api` (TypeScript + Express + Prisma) and
`cloudschedule-client` (Create React App). Use these notes to be immediately productive when
editing or generating code.

Key concepts (big picture)
- API: `cloudschedule-api/src/index.ts` mounts an `apiRouter` at `/api` and applies `authMiddleware`
  to all routes. Inspect `src/routes/*` for endpoints (examples below).
- DB: Prisma client exported from `src/services/db.ts` (single shared instance). Prisma schema is
  `prisma/schema.prisma` and uses `sqlserver` as the datasource provider.
- Frontend: `cloudschedule-client` is a Create React App app. It proxies API calls to
  `http://localhost:8080` (see `package.json`), so the client talks to the server at `/api/*`.

Auth and request shape
- `src/middleware/auth.ts` implements auth. In development it accepts `x-mock-email` header.
  In production it expects `x-ms-client-principal` (Base64 JSON) from Azure Easy Auth. The
  middleware runs on every `/api` request and attaches a Prisma `User` to `req.user`.
- Code can safely assume `req.user` exists after the middleware (routes call `req.user!`).

Prisma patterns and caveats
- Models: `User`, `TimeSlot`, `Booking` (see `prisma/schema.prisma`) — note the relations and
  that `Booking.slotId` is `@unique` (1:1 with TimeSlot).
- Bulk creation: `timeSlot` uses `prisma.timeSlot.createMany()` in `routes/timeslotRoutes.ts` to
  generate many 30-minute slots. `createMany` does NOT return created records — the route
  returns the array it generated. Don't change this without updating the client expectations.

Important files to inspect when changing behavior
- Server entry: `cloudschedule-api/src/index.ts`
- Auth: `cloudschedule-api/src/middleware/auth.ts`
- DB client: `cloudschedule-api/src/services/db.ts`
- Routes: `cloudschedule-api/src/routes/*.ts` (notable endpoints: `/api/users/me`,
  `/api/bookings/me`, `POST /api/slots`)
- Prisma schema: `cloudschedule-api/prisma/schema.prisma`
- Client API wrapper: `cloudschedule-client/src/services/apiService.ts` (calls the endpoints)

Dev / run commands (Windows PowerShell notes)
- Server build: `npm run build` (runs `tsc`) then `npm start` (runs `node dist/index.js`).
- Dev server (fast reload): package.json has `start:dev` defined as POSIX-style
  `NODE_ENV=development ts-node-dev ...`. On Windows PowerShell use either:

  $env:NODE_ENV = 'development'; npx ts-node-dev --respawn --transpile-only src/index.ts

  or install `cross-env` and change the script to `cross-env NODE_ENV=development ts-node-dev ...`.
- Client: `cd cloudschedule-client && npm start` (CRA dev server at http://localhost:3000).

Conventions & examples
- Routes assume `req.user` contains `{ userId, role, displayName, email }` from Prisma.
  Example: `GET /api/bookings/me` uses `req.user!.userId` and branches by `role` (`INSTRUCTOR` vs `STUDENT`).
- Authorization checks are done in-route (e.g., `timeslotRoutes.ts` rejects non-INSTRUCTOR users).
- Error handling: routes use try/catch and return `res.status(500).json({ message: '...' })`.

Integration points
- CORS: Server allows origin `http://localhost:3000` in `src/index.ts`. The client also uses
  a proxy to avoid CORS in development.
- Environment: Server uses `dotenv`. Ensure `.env` contains `DATABASE_URL` (SQL Server) and
  optionally `PORT` and `NODE_ENV`.

When changing DB logic
- Prefer using the shared `prisma` instance from `src/services/db.ts`.
- Be careful with `createMany` (no return) vs `create` / `createMany` + `findMany` when
  the endpoint must return created records.

If you need to modify auth
- Preserve behavior for dev (`x-mock-email`) and Azure (`x-ms-client-principal`). If you
  change the middleware shape, update all routes that rely on `req.user` and update client tests.

If anything in this summary is unclear or you'd like more examples (example request/response
for a specific endpoint, or suggested scripts for Windows), tell me which part and I will iterate.
