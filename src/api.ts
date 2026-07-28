/**
 * Public Transport Tracker API client.
 *
 * Typed fetch wrapper around the Express + SQLite backend.
 * Each function accepts an optional AbortSignal for timeout/cancellation.
 * Consumers can check the return type for errors, or use
 * `checkApiHealth()` before making data requests.
 */

import type { Arrival, Route, Stop, TransportSnapshot } from './types';

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001';

/* ------------------------------------------------------------------ */
/*  Internal helpers                                                   */
/* ------------------------------------------------------------------ */

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new ApiError(body || res.statusText, res.status);
  }

  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/*  Stop favorites                                                     */
/* ------------------------------------------------------------------ */

/** Toggle favorite status for a stop. Returns the stop object. */
export async function toggleFavoriteStop(
  stopId: string,
  isFavorite: boolean,
  signal?: AbortSignal,
): Promise<void> {
  await request<void>(
    `/api/stops/${encodeURIComponent(stopId)}/favorite`,
    {
      signal,
      method: 'PUT',
      body: JSON.stringify({ isFavorite }),
    },
  );
}

/* ------------------------------------------------------------------ */
/*  Public helpers                                                     */
/* ------------------------------------------------------------------ */

/** True when the backend is reachable at the configured API_BASE. */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  Snapshot — full transport state in one call                        */
/* ------------------------------------------------------------------ */

/** Fetch the full transport snapshot (stops with parsed lines, routes
 *  with stop lists, and all arrivals). */
export async function fetchSnapshot(
  signal?: AbortSignal,
): Promise<TransportSnapshot> {
  return request<TransportSnapshot>('/api/snapshot', { signal });
}

/* ------------------------------------------------------------------ */
/*  Stops                                                              */
/* ------------------------------------------------------------------ */

/** Fetch all stops. Each stop has `lines` as a parsed string array. */
export async function fetchStops(signal?: AbortSignal): Promise<Stop[]> {
  const data = await request<Stop[]>('/api/stops', { signal });
  return data.map((s) => ({
    ...s,
    lines: typeof s.lines === 'string' ? JSON.parse(s.lines) : s.lines,
  }));
}

/** Fetch a single stop by id. */
export async function fetchStop(
  stopId: string,
  signal?: AbortSignal,
): Promise<Stop> {
  const data = await request<Stop>(`/api/stops/${encodeURIComponent(stopId)}`, {
    signal,
  });
  return {
    ...data,
    lines: typeof data.lines === 'string' ? JSON.parse(data.lines) : data.lines,
  };
}

/** Fetch arrivals for a specific stop, sorted by expected time. */
export async function fetchStopArrivals(
  stopId: string,
  signal?: AbortSignal,
): Promise<Arrival[]> {
  return request<Arrival[]>(
    `/api/stops/${encodeURIComponent(stopId)}/arrivals`,
    { signal },
  );
}

/* ------------------------------------------------------------------ */
/*  Routes                                                             */
/* ------------------------------------------------------------------ */

/** Fetch all routes with their ordered stop lists. */
export async function fetchRoutes(signal?: AbortSignal): Promise<Route[]> {
  return request<Route[]>('/api/routes', { signal });
}

/** Fetch a single route by id with its ordered stop list. */
export async function fetchRoute(
  routeId: string,
  signal?: AbortSignal,
): Promise<Route> {
  return request<Route>(`/api/routes/${encodeURIComponent(routeId)}`, {
    signal,
  });
}

/* ------------------------------------------------------------------ */
/*  Arrivals                                                           */
/* ------------------------------------------------------------------ */

/** Fetch arrivals, optionally filtered by stop and/or route.
 *  Returns results sorted by expected time. */
export async function fetchArrivals(
  filters?: { stopId?: string; routeId?: string },
  signal?: AbortSignal,
): Promise<Arrival[]> {
  const params = new URLSearchParams();
  if (filters?.stopId) params.set('stopId', filters.stopId);
  if (filters?.routeId) params.set('routeId', filters.routeId);
  const qs = params.toString();

  return request<Arrival[]>(`/api/arrivals${qs ? `?${qs}` : ''}`, { signal });
}
