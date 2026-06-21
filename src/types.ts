export type ArrivalStatus = 'on-time' | 'delayed' | 'boarding' | 'cancelled';

export type Stop = {
  id: string;
  name: string;
  code: string;
  area: string;
  lines: string[];
  isFavorite: boolean;
};

export type RouteStop = {
  stopId: string;
  stopName: string;
  order: number;
};

export type Route = {
  id: string;
  line: string;
  destination: string;
  color: string;
  stops: RouteStop[];
};

export type Arrival = {
  id: string;
  stopId: string;
  routeId: string;
  line: string;
  destination: string;
  scheduledAt: string;
  expectedAt: string;
  status: ArrivalStatus;
  platform?: string;
  disruptionNote?: string;
};

export type TransportSnapshot = {
  generatedAt: string;
  stops: Stop[];
  routes: Route[];
  arrivals: Arrival[];
};

export type LineFilter = 'all' | string;
export type BoardView = 'all' | 'disrupted' | 'smooth';
export type RecentStopFilter = 'all' | 'disrupted';
export type RecentStopSort = 'recent' | 'urgent';

export type RecentStopView = {
  stopId: string;
  viewedAt: string;
};

export type RecentStopEntry = RecentStopView & { stop: Stop };

export type RecentStopDisruptionSummary = {
  label: string;
  tone: 'calm' | 'warning';
  disruptedCount: number;
};
