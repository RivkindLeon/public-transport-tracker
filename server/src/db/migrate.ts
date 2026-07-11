import { rawDb } from './index.ts';
import { stops, routes, routeStops, arrivals } from './schema.ts';
import { drizzle } from 'drizzle-orm/better-sqlite3';

function pushSchema() {
  // Create tables using raw SQL since Drizzle push requires drizzle-kit
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS stops (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      area TEXT NOT NULL,
      lines TEXT NOT NULL DEFAULT '[]',
      is_favorite INTEGER NOT NULL DEFAULT 0
    )
  `);
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      line TEXT NOT NULL,
      destination TEXT NOT NULL,
      color TEXT NOT NULL
    )
  `);
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS route_stops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      route_id TEXT NOT NULL REFERENCES routes(id),
      stop_id TEXT NOT NULL REFERENCES stops(id),
      stop_name TEXT NOT NULL,
      "order" INTEGER NOT NULL
    )
  `);
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS arrivals (
      id TEXT PRIMARY KEY,
      stop_id TEXT NOT NULL REFERENCES stops(id),
      route_id TEXT NOT NULL REFERENCES routes(id),
      line TEXT NOT NULL,
      destination TEXT NOT NULL,
      scheduled_at TEXT NOT NULL,
      expected_at TEXT NOT NULL,
      status TEXT NOT NULL,
      platform TEXT,
      disruption_note TEXT
    )
  `);
  console.log('✓ Tables created (if not already present)');
}

pushSchema();
rawDb.close();