import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core';

export const stops = sqliteTable('stops', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  area: text('area').notNull(),
  lines: text('lines').notNull(), // JSON array stored as text
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
});

export const routes = sqliteTable('routes', {
  id: text('id').primaryKey(),
  line: text('line').notNull(),
  destination: text('destination').notNull(),
  color: text('color').notNull(),
});

export const routeStops = sqliteTable('route_stops', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  routeId: text('route_id').notNull().references(() => routes.id),
  stopId: text('stop_id').notNull().references(() => stops.id),
  stopName: text('stop_name').notNull(),
  order: integer('order').notNull(),
});

export const arrivals = sqliteTable('arrivals', {
  id: text('id').primaryKey(),
  stopId: text('stop_id').notNull().references(() => stops.id),
  routeId: text('route_id').notNull().references(() => routes.id),
  line: text('line').notNull(),
  destination: text('destination').notNull(),
  scheduledAt: text('scheduled_at').notNull(),
  expectedAt: text('expected_at').notNull(),
  status: text('status').notNull(), // 'on-time' | 'delayed' | 'boarding' | 'cancelled'
  platform: text('platform'),
  disruptionNote: text('disruption_note'),
});