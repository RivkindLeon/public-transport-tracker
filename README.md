# Public Transport Tracker

A public project for exploring an app that helps users track public transport schedules online, check routes, see expected arrival times, and follow schedule changes.

## Who it is for

- everyday public transport users
- commuters who want clearer schedule visibility

## Problem

Public transport information is often fragmented, delayed, or hard to compare, which makes trip planning and schedule monitoring harder than it should be.

## Current status

Product framing is in place, and the first mocked-arrivals app shell is now available locally with stop selection, arrival boards, route detail rendering, and persisted pinned stops powered by local mock data.

## Next milestone

Refine the mocked experience with focused interactions such as disruption drill-down, preference persistence for more board state, or lightweight trip-context views before choosing any real transport data provider.

See `docs/mocked-arrivals-foundation.md` for the v0 scope, entities, mock data shape, and exit criteria.

## Local development

### Frontend only

```bash
npm install
npm run dev
```

### Full stack (frontend + backend)

The backend is a separate Node.js + Express + SQLite server in `server/`. It provides all the same data that the frontend currently uses from mock data, served through a REST API on `http://localhost:3001`.

**Quick start:**

```bash
# Start both frontend and backend
./start.sh
```

**Or start individually:**

```bash
# Terminal 1: Backend
cd server
npm install
npm run seed
npm run dev

# Terminal 2: Frontend
npm install
npm run dev
```

### Backend API

| Endpoint | Description |
|----------|-------------|
| `GET /api/snapshot` | Full transport snapshot (stops, routes with stop lists, arrivals) |
| `GET /api/health` | Health check with stop count |
| `GET /api/stops` | List all stops |
| `GET /api/stops/:id` | Single stop by ID |
| `GET /api/stops/:id/arrivals` | Arrivals for a stop, sorted by expected time |
| `GET /api/routes` | List all routes with ordered stops |
| `GET /api/routes/:id` | Single route by ID with ordered stops |
| `GET /api/arrivals?stopId=&routeId=` | Query arrivals with optional filters |

To use the backend API from the frontend, set `VITE_API_BASE=http://localhost:3001` in a `.env` file (the API client will be wired in a follow-up PR).

### Backend tech stack

- **Runtime:** Node.js 22 + TypeScript (ESM, via tsx)
- **Framework:** Express 4
- **Database:** SQLite (via better-sqlite3)
- **ORM:** Drizzle ORM
- **CORS:** Enabled by default for the Vite dev server origin

## Repository visibility

This repository is public.
