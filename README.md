# Public Transport Tracker

A public project for exploring an app that helps users track public transport schedules online, check routes, see expected arrival times, and follow schedule changes.

## Who it is for

- everyday public transport users
- commuters who want clearer schedule visibility

## Problem

Public transport information is often fragmented, delayed, or hard to compare, which makes trip planning and schedule monitoring harder than it should be.

## Current status

Full-stack MVP complete. React + TypeScript + Vite frontend connected to an Express + SQLite backend via REST API (Drizzle ORM). Features include stop selection, arrival boards with line filtering and disruption detection, route detail rendering, and favorited stops with full server persistence. All data operations go through the API with graceful fallback to mock data when the backend is unreachable.

## Current features

- Stop browsing with sorting (favorites, name, distance)
- Arrival boards per stop with line filtering and disruption/smooth status
- Route detail views with ordered stop lists
- Favorited stops persisted to server via PUT /api/stops/:id/favorite
- Recent stop history with filters and sorting
- Board state persistence per stop
- Full REST API for stops, routes, arrivals, and favorites

## Local development

### Frontend only

```bash
npm install
npm run dev
```

### Full stack (frontend + backend)

The backend is a Node.js + Express + SQLite server using Drizzle ORM in `server/`. It provides a complete REST API serving real transport data (stops, routes, arrivals) that the frontend consumes directly when available, with mock data as a graceful fallback for development.

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

| Endpoint                             | Description                                                       |
| ------------------------------------ | ----------------------------------------------------------------- |
| `GET /api/snapshot`                  | Full transport snapshot (stops, routes with stop lists, arrivals) |
| `GET /api/health`                    | Health check with stop count                                      |
| `GET /api/stops`                     | List all stops                                                    |
| `GET /api/stops/:id`                 | Single stop by ID                                                 |
| `GET /api/stops/:id/arrivals`        | Arrivals for a stop, sorted by expected time                      |
| `GET /api/routes`                    | List all routes with ordered stops                                |
| `GET /api/routes/:id`                | Single route by ID with ordered stops                             |
| `GET /api/arrivals?stopId=&routeId=` | Query arrivals with optional filters                              |

To use the backend API from the frontend, set `VITE_API_BASE=http://localhost:3001` in a `.env` file.

### Backend tech stack

- **Runtime:** Node.js 22 + TypeScript (ESM, via tsx)
- **Framework:** Express 4
- **Database:** SQLite (via better-sqlite3)
- **ORM:** Drizzle ORM
- **CORS:** Enabled by default for the Vite dev server origin

## Repository visibility

This repository is public.

## Project Status: Archived

This project has been archived as of 2026-08-20. All features are complete and functional. The MVP+ status has been confirmed.

- ✅ Full-stack MVP complete
- ✅ All CRUD operations functional
- ✅ Tests passing
- ✅ Documentation complete
- ✅ Docker production setup validated

