import express from 'express';
import cors from 'cors';
import { db } from './db/index.ts';
import { stops, routes, routeStops, arrivals } from './db/schema.ts';
import { eq, sql } from 'drizzle-orm';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);

app.use(cors());
app.use(express.json());

// ── Full snapshot ──────────────────────────────────────────────────────
app.get('/api/snapshot', (_req, res) => {
  const allStops = db.select().from(stops).all();
  const allRoutes = db.select().from(routes).all();
  const allArrivals = db.select().from(arrivals).all();
  const allRouteStops = db.select().from(routeStops).all();

  const parsedStops = allStops.map((s) => ({
    ...s,
    lines: JSON.parse(s.lines) as string[],
  }));

  const routesWithStops = allRoutes.map((r) => ({
    ...r,
    stops: allRouteStops
      .filter((rs) => rs.routeId === r.id)
      .sort((a, b) => a.order - b.order)
      .map((rs) => ({
        stopId: rs.stopId,
        stopName: rs.stopName,
        order: rs.order,
      })),
  }));

  res.json({
    generatedAt: new Date().toISOString(),
    stops: parsedStops,
    routes: routesWithStops,
    arrivals: allArrivals,
  });
});

// ── Stops ──────────────────────────────────────────────────────────────
app.get('/api/stops', (_req, res) => {
  const allStops = db.select().from(stops).all();
  res.json(
    allStops.map((s) => ({ ...s, lines: JSON.parse(s.lines) as string[] })),
  );
});

app.get('/api/stops/:stopId', (req, res) => {
  const stop = db
    .select()
    .from(stops)
    .where(eq(stops.id, req.params.stopId))
    .get();
  if (!stop) {
    res.status(404).json({ error: 'Stop not found' });
    return;
  }
  res.json({ ...stop, lines: JSON.parse(stop.lines) as string[] });
});

// ── Stop favorites toggle ───────────────────────────────────────────
app.put('/api/stops/:id/favorite', (req, res) => {
  const { isFavorite } = req.body;

  if (typeof isFavorite !== 'boolean') {
    res.status(400).json({ error: 'Body must include isFavorite as a boolean' });
    return;
  }

  const existing = db
    .select()
    .from(stops)
    .where(eq(stops.id, req.params.id))
    .get();
  if (!existing) {
    res.status(404).json({ error: 'Stop not found' });
    return;
  }

  db.update(stops)
    .set({ isFavorite })
    .where(eq(stops.id, req.params.id))
    .run();

  const updated = db
    .select()
    .from(stops)
    .where(eq(stops.id, req.params.id))
    .get();
  res.json({
    ...updated,
    lines: JSON.parse(updated!.lines) as string[],
  });
});

app.get('/api/stops/:stopId/arrivals', (req, res) => {
  const stopArrivals = db
    .select()
    .from(arrivals)
    .where(eq(arrivals.stopId, req.params.stopId))
    .all()
    .sort(
      (a, b) =>
        new Date(a.expectedAt).getTime() - new Date(b.expectedAt).getTime(),
    );
  res.json(stopArrivals);
});

// ── Routes ─────────────────────────────────────────────────────────────
app.get('/api/routes', (_req, res) => {
  const allRoutes = db.select().from(routes).all();
  const allRouteStops = db.select().from(routeStops).all();

  const result = allRoutes.map((r) => ({
    ...r,
    stops: allRouteStops
      .filter((rs) => rs.routeId === r.id)
      .sort((a, b) => a.order - b.order)
      .map((rs) => ({
        stopId: rs.stopId,
        stopName: rs.stopName,
        order: rs.order,
      })),
  }));

  res.json(result);
});

app.get('/api/routes/:routeId', (req, res) => {
  const route = db
    .select()
    .from(routes)
    .where(eq(routes.id, req.params.routeId))
    .get();
  if (!route) {
    res.status(404).json({ error: 'Route not found' });
    return;
  }
  const routeStopList = db
    .select()
    .from(routeStops)
    .where(eq(routeStops.routeId, req.params.routeId))
    .all()
    .sort((a, b) => a.order - b.order)
    .map((rs) => ({
      stopId: rs.stopId,
      stopName: rs.stopName,
      order: rs.order,
    }));

  res.json({ ...route, stops: routeStopList });
});

// ── Arrivals ───────────────────────────────────────────────────────────
app.get('/api/arrivals', (req, res) => {
  const query = db.select().from(arrivals).$dynamic();

  if (req.query.stopId) {
    query.where(eq(arrivals.stopId, req.query.stopId as string));
  }
  if (req.query.routeId) {
    query.where(eq(arrivals.routeId, req.query.routeId as string));
  }

  const result = query.all();
  res.json(
    result.sort(
      (a, b) =>
        new Date(a.expectedAt).getTime() - new Date(b.expectedAt).getTime(),
    ),
  );
});

// ── Health ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const stopCount = db
    .select({ count: sql<number>`count(*)` })
    .from(stops)
    .get();
  res.json({
    status: 'ok',
    stopCount: stopCount?.count ?? 0,
    timestamp: new Date().toISOString(),
  });
});

// ── Startup ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(
    `🚍 Public Transport Tracker API running on http://localhost:${PORT}`,
  );
  console.log(`   Endpoints:`);
  console.log(`   GET /api/snapshot   — full transport snapshot`);
  console.log(`   GET /api/health     — health check`);
  console.log(`   GET /api/stops      — list all stops`);
  console.log(`   GET /api/stops/:id  — get a stop by id`);
  console.log(`   PUT /api/stops/:id/favorite — toggle stop favorite status`);
  console.log(`   GET /api/stops/:id/arrivals — arrivals for a stop`);
  console.log(`   GET /api/routes     — list all routes with stops`);
  console.log(`   GET /api/routes/:id — get a route by id`);
  console.log(`   GET /api/arrivals?stopId=&routeId= — query arrivals`);
});
