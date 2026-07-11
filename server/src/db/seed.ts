import { db, rawDb } from './index.ts';
import { stops, routes, routeStops, arrivals } from './schema.ts';

const now = new Date();

const minutesFromNow = (minutes: number) =>
  new Date(now.getTime() + minutes * 60_000).toISOString();

function seed() {
  // Drop existing data
  rawDb.exec('DELETE FROM arrivals');
  rawDb.exec('DELETE FROM route_stops');
  rawDb.exec('DELETE FROM routes');
  rawDb.exec('DELETE FROM stops');

  // Insert stops
  db.insert(stops).values([
    { id: 'stop-central', name: 'Central Station', code: '1001', area: 'Downtown', lines: JSON.stringify(['10', '18', '42']), isFavorite: true },
    { id: 'stop-market', name: 'Market Street', code: '1002', area: 'Downtown', lines: JSON.stringify(['10', '27']), isFavorite: true },
    { id: 'stop-riverside', name: 'Riverside Park', code: '1003', area: 'North Bank', lines: JSON.stringify(['18', '33']), isFavorite: false },
    { id: 'stop-campus', name: 'City Campus', code: '1004', area: 'University District', lines: JSON.stringify(['18', '42']), isFavorite: false },
    { id: 'stop-hospital', name: 'General Hospital', code: '1005', area: 'West End', lines: JSON.stringify(['27', '33']), isFavorite: false },
    { id: 'stop-harbor', name: 'Harbor Terminal', code: '1006', area: 'Waterfront', lines: JSON.stringify(['10', '42']), isFavorite: false },
  ]).run();

  // Insert routes
  db.insert(routes).values([
    { id: 'route-10', line: '10', destination: 'Harbor Terminal', color: '#38bdf8' },
    { id: 'route-18', line: '18', destination: 'City Campus', color: '#22c55e' },
    { id: 'route-27', line: '27', destination: 'General Hospital', color: '#f59e0b' },
    { id: 'route-42', line: '42', destination: 'Harbor Terminal', color: '#a855f7' },
    { id: 'route-33', line: '33', destination: 'General Hospital', color: '#ef4444' },
  ]).run();

  // Insert route stops
  db.insert(routeStops).values([
    { routeId: 'route-10', stopId: 'stop-central', stopName: 'Central Station', order: 1 },
    { routeId: 'route-10', stopId: 'stop-market', stopName: 'Market Street', order: 2 },
    { routeId: 'route-10', stopId: 'stop-hospital', stopName: 'General Hospital', order: 3 },
    { routeId: 'route-10', stopId: 'stop-harbor', stopName: 'Harbor Terminal', order: 4 },
    { routeId: 'route-18', stopId: 'stop-central', stopName: 'Central Station', order: 1 },
    { routeId: 'route-18', stopId: 'stop-riverside', stopName: 'Riverside Park', order: 2 },
    { routeId: 'route-18', stopId: 'stop-campus', stopName: 'City Campus', order: 3 },
    { routeId: 'route-27', stopId: 'stop-market', stopName: 'Market Street', order: 1 },
    { routeId: 'route-27', stopId: 'stop-hospital', stopName: 'General Hospital', order: 2 },
    { routeId: 'route-42', stopId: 'stop-central', stopName: 'Central Station', order: 1 },
    { routeId: 'route-42', stopId: 'stop-campus', stopName: 'City Campus', order: 2 },
    { routeId: 'route-42', stopId: 'stop-harbor', stopName: 'Harbor Terminal', order: 3 },
    { routeId: 'route-33', stopId: 'stop-riverside', stopName: 'Riverside Park', order: 1 },
    { routeId: 'route-33', stopId: 'stop-hospital', stopName: 'General Hospital', order: 2 },
  ]).run();

  // Insert arrivals
  db.insert(arrivals).values([
    { id: 'arr-1', stopId: 'stop-central', routeId: 'route-10', line: '10', destination: 'Harbor Terminal', scheduledAt: minutesFromNow(3), expectedAt: minutesFromNow(3), status: 'boarding', platform: 'A1' },
    { id: 'arr-2', stopId: 'stop-central', routeId: 'route-18', line: '18', destination: 'City Campus', scheduledAt: minutesFromNow(7), expectedAt: minutesFromNow(11), status: 'delayed', platform: 'B3', disruptionNote: 'Traffic congestion near Riverside Park' },
    { id: 'arr-3', stopId: 'stop-central', routeId: 'route-42', line: '42', destination: 'Harbor Terminal', scheduledAt: minutesFromNow(12), expectedAt: minutesFromNow(12), status: 'on-time', platform: 'C2' },
    { id: 'arr-4', stopId: 'stop-market', routeId: 'route-10', line: '10', destination: 'Harbor Terminal', scheduledAt: minutesFromNow(5), expectedAt: minutesFromNow(5), status: 'on-time', platform: 'M1' },
    { id: 'arr-5', stopId: 'stop-market', routeId: 'route-27', line: '27', destination: 'General Hospital', scheduledAt: minutesFromNow(8), expectedAt: minutesFromNow(18), status: 'delayed', platform: 'M3', disruptionNote: 'Vehicle swap in progress' },
    { id: 'arr-6', stopId: 'stop-riverside', routeId: 'route-18', line: '18', destination: 'City Campus', scheduledAt: minutesFromNow(4), expectedAt: minutesFromNow(4), status: 'on-time', platform: 'R2' },
    { id: 'arr-7', stopId: 'stop-riverside', routeId: 'route-33', line: '33', destination: 'General Hospital', scheduledAt: minutesFromNow(10), expectedAt: minutesFromNow(10), status: 'cancelled', platform: 'R4', disruptionNote: 'Cancelled due to driver shortage' },
    { id: 'arr-8', stopId: 'stop-campus', routeId: 'route-18', line: '18', destination: 'City Campus', scheduledAt: minutesFromNow(2), expectedAt: minutesFromNow(2), status: 'boarding', platform: 'U1' },
    { id: 'arr-9', stopId: 'stop-campus', routeId: 'route-42', line: '42', destination: 'Harbor Terminal', scheduledAt: minutesFromNow(9), expectedAt: minutesFromNow(9), status: 'on-time', platform: 'U4' },
    { id: 'arr-10', stopId: 'stop-hospital', routeId: 'route-27', line: '27', destination: 'General Hospital', scheduledAt: minutesFromNow(6), expectedAt: minutesFromNow(6), status: 'on-time', platform: 'H2' },
    { id: 'arr-11', stopId: 'stop-hospital', routeId: 'route-33', line: '33', destination: 'General Hospital', scheduledAt: minutesFromNow(14), expectedAt: minutesFromNow(22), status: 'delayed', platform: 'H5', disruptionNote: 'Temporary lane closure near West End' },
    { id: 'arr-12', stopId: 'stop-harbor', routeId: 'route-10', line: '10', destination: 'Harbor Terminal', scheduledAt: minutesFromNow(1), expectedAt: minutesFromNow(1), status: 'boarding', platform: 'T1' },
    { id: 'arr-13', stopId: 'stop-harbor', routeId: 'route-42', line: '42', destination: 'Harbor Terminal', scheduledAt: minutesFromNow(16), expectedAt: minutesFromNow(16), status: 'on-time', platform: 'T4' },
  ]).run();

  console.log('✓ Seeded transport.db with stops, routes, route_stops, and arrivals');
}

seed();
rawDb.close();