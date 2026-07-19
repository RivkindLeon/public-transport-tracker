import { useEffect, useState } from 'react';
import { checkApiHealth, fetchSnapshot } from '../api';
import type { Arrival, Route, Stop } from '../types';

export interface ApiBootstrapResult {
  /** Arrivals keyed by stop id. Empty map until the API responds. */
  apiArrivals: Map<string, Arrival[]>;
  /** Routes keyed by route id. Empty map until the API responds. */
  apiRoutes: Map<string, Route>;
  /** True when the backend is reachable and the snapshot was fetched. */
  apiHealthy: boolean;
}

/**
 * On mount, checks the backend health and loads the full transport
 * snapshot (stops, routes, arrivals) when reachable.
 *
 * Falls back silently to mock data on any error.
 *
 * @param onStopsReady — called once with API-loaded stops so the
 *   parent hook can replace its local mock state with live data.
 */
export function useApiBootstrap(
  onStopsReady: (stops: Stop[]) => void,
): ApiBootstrapResult {
  const [apiArrivals, setApiArrivals] = useState<Map<string, Arrival[]>>(
    new Map(),
  );
  const [apiRoutes, setApiRoutes] = useState<Map<string, Route>>(new Map());
  const [apiHealthy, setApiHealthy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    checkApiHealth()
      .then((healthy) => {
        if (cancelled) return;
        setApiHealthy(healthy);

        if (!healthy) return;

        return fetchSnapshot().then((snap) => {
          if (cancelled) return;

          const sortedStops = snap.stops.sort((a, b) =>
            a.isFavorite === b.isFavorite
              ? a.name.localeCompare(b.name)
              : a.isFavorite
                ? -1
                : 1,
          );

          // Let the parent replace its mock stops with live data.
          // This is safe — the callback is called inside a .then()
          // handler, not from a synchronous effect body.
          onStopsReady(sortedStops);

          setApiArrivals(
            new Map(
              sortedStops.map((s) => [
                s.id,
                snap.arrivals
                  .filter((a) => a.stopId === s.id)
                  .sort(
                    (a, b) =>
                      new Date(a.expectedAt).getTime() -
                      new Date(b.expectedAt).getTime(),
                  ),
              ]),
            ),
          );
          setApiRoutes(new Map(snap.routes.map((r) => [r.id, r])));
        });
      })
      .catch(() => {
        // API unreachable — keep using mock data
      });

    return () => {
      cancelled = true;
    };
  }, [onStopsReady]);

  return { apiArrivals, apiRoutes, apiHealthy };
}