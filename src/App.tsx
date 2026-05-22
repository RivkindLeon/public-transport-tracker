import { useEffect, useMemo, useState } from 'react';
import { getRoute, getStopArrivals, getTransportSnapshot } from './data/mockData';
import type { Arrival, ArrivalStatus, Stop } from './types';

const snapshot = getTransportSnapshot();
const favoriteStopsStorageKey = 'public-transport-tracker.favorite-stop-ids';
const selectedStopStorageKey = 'public-transport-tracker.selected-stop-id';
const activeLineStorageKey = 'public-transport-tracker.active-line';
const selectedArrivalStorageKey = 'public-transport-tracker.selected-arrivals';
const recentStopsStorageKey = 'public-transport-tracker.recent-stop-ids';

const sortStops = (stops: Stop[]) =>
  [...stops].sort((left, right) => {
    if (left.isFavorite === right.isFavorite) {
      return left.name.localeCompare(right.name);
    }

    return left.isFavorite ? -1 : 1;
  });

const getInitialStops = () => {
  if (typeof window === 'undefined') {
    return sortStops(snapshot.stops);
  }

  const savedFavoriteStopIds = window.localStorage.getItem(favoriteStopsStorageKey);

  if (!savedFavoriteStopIds) {
    return sortStops(snapshot.stops);
  }

  try {
    const favoriteStopIds = new Set(JSON.parse(savedFavoriteStopIds) as string[]);

    return sortStops(
      snapshot.stops.map((stop) => ({
        ...stop,
        isFavorite: favoriteStopIds.has(stop.id),
      })),
    );
  } catch {
    return sortStops(snapshot.stops);
  }
};

const initialStops = getInitialStops();

const getInitialSelectedStopId = () => {
  if (typeof window === 'undefined') {
    return initialStops[0]?.id ?? '';
  }

  const savedSelectedStopId = window.localStorage.getItem(selectedStopStorageKey);

  if (savedSelectedStopId && initialStops.some((stop) => stop.id === savedSelectedStopId)) {
    return savedSelectedStopId;
  }

  return initialStops[0]?.id ?? '';
};

const getInitialActiveLine = (selectedStopId: string) => {
  if (typeof window === 'undefined') {
    return 'all';
  }

  const savedActiveLine = window.localStorage.getItem(activeLineStorageKey);
  const selectedStop = initialStops.find((stop) => stop.id === selectedStopId);

  if (savedActiveLine && savedActiveLine !== 'all' && selectedStop?.lines.includes(savedActiveLine)) {
    return savedActiveLine;
  }

  return 'all';
};

const getSavedSelectedArrivals = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, string>;
  }

  const savedSelectedArrivals = window.localStorage.getItem(selectedArrivalStorageKey);

  if (!savedSelectedArrivals) {
    return {} as Record<string, string>;
  }

  try {
    return JSON.parse(savedSelectedArrivals) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
};

const getInitialSelectedArrivalId = (selectedStopId: string, lineFilter: 'all' | string) => {
  const stopArrivals = getStopArrivals(selectedStopId);
  const savedSelectedArrivalId = getSavedSelectedArrivals()[selectedStopId];
  const visibleArrivals =
    lineFilter === 'all' ? stopArrivals : stopArrivals.filter((arrival) => arrival.line === lineFilter);

  if (savedSelectedArrivalId && visibleArrivals.some((arrival) => arrival.id === savedSelectedArrivalId)) {
    return savedSelectedArrivalId;
  }

  return visibleArrivals[0]?.id ?? '';
};

const getInitialRecentStopIds = () => {
  if (typeof window === 'undefined') {
    return [] as string[];
  }

  const savedRecentStopIds = window.localStorage.getItem(recentStopsStorageKey);

  if (!savedRecentStopIds) {
    return [] as string[];
  }

  try {
    const recentStopIds = JSON.parse(savedRecentStopIds) as string[];

    return recentStopIds.filter((stopId) => initialStops.some((stop) => stop.id === stopId));
  } catch {
    return [] as string[];
  }
};

const statusLabels: Record<ArrivalStatus, string> = {
  'on-time': 'On time',
  delayed: 'Delayed',
  boarding: 'Boarding',
  cancelled: 'Cancelled',
};

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const getMinutesUntil = (value: string) => {
  const deltaMs = new Date(value).getTime() - Date.now();
  const minutes = Math.max(0, Math.round(deltaMs / 60_000));

  return minutes === 0 ? 'Due now' : `${minutes} min`;
};

export default function App() {
  const [stops, setStops] = useState<Stop[]>(() => initialStops);
  const [selectedStopId, setSelectedStopId] = useState(() => getInitialSelectedStopId());
  const [recentStopIds, setRecentStopIds] = useState<string[]>(() => getInitialRecentStopIds());
  const [activeLine, setActiveLine] = useState<'all' | string>(() => getInitialActiveLine(getInitialSelectedStopId()));
  const stopArrivals = useMemo(() => getStopArrivals(selectedStopId), [selectedStopId]);
  const [selectedArrivalId, setSelectedArrivalId] = useState(() =>
    getInitialSelectedArrivalId(getInitialSelectedStopId(), getInitialActiveLine(getInitialSelectedStopId())),
  );

  const selectedStop = stops.find((stop) => stop.id === selectedStopId) ?? stops[0];
  const availableLines = selectedStop?.lines ?? [];
  const arrivals = useMemo(
    () => (activeLine === 'all' ? stopArrivals : stopArrivals.filter((arrival) => arrival.line === activeLine)),
    [activeLine, stopArrivals],
  );
  const selectedArrival = arrivals.find((arrival) => arrival.id === selectedArrivalId) ?? arrivals[0];
  const selectedRoute = selectedArrival ? getRoute(selectedArrival.routeId) : undefined;

  const favoriteStops = stops.filter((stop) => stop.isFavorite);
  const recentStops = recentStopIds
    .map((stopId) => stops.find((stop) => stop.id === stopId))
    .filter((stop): stop is Stop => Boolean(stop));
  const nearbyStops = stops.filter((stop) => !stop.isFavorite && !recentStopIds.includes(stop.id));

  useEffect(() => {
    window.localStorage.setItem(
      favoriteStopsStorageKey,
      JSON.stringify(stops.filter((stop) => stop.isFavorite).map((stop) => stop.id)),
    );
  }, [stops]);

  useEffect(() => {
    window.localStorage.setItem(selectedStopStorageKey, selectedStopId);
  }, [selectedStopId]);

  useEffect(() => {
    window.localStorage.setItem(recentStopsStorageKey, JSON.stringify(recentStopIds));
  }, [recentStopIds]);

  useEffect(() => {
    window.localStorage.setItem(activeLineStorageKey, activeLine);
  }, [activeLine]);

  useEffect(() => {
    const savedSelectedArrivals = getSavedSelectedArrivals();

    if (selectedArrivalId) {
      window.localStorage.setItem(
        selectedArrivalStorageKey,
        JSON.stringify({
          ...savedSelectedArrivals,
          [selectedStopId]: selectedArrivalId,
        }),
      );
      return;
    }

    if (!savedSelectedArrivals[selectedStopId]) {
      return;
    }

    const { [selectedStopId]: _removedSelectedArrival, ...remainingSelectedArrivals } = savedSelectedArrivals;
    window.localStorage.setItem(selectedArrivalStorageKey, JSON.stringify(remainingSelectedArrivals));
  }, [selectedArrivalId, selectedStopId]);

  useEffect(() => {
    if (!availableLines.includes(activeLine)) {
      setActiveLine('all');
    }
  }, [activeLine, availableLines]);

  useEffect(() => {
    if (!arrivals.some((arrival) => arrival.id === selectedArrivalId)) {
      const savedSelectedArrivalId = getSavedSelectedArrivals()[selectedStopId];
      const nextSelectedArrivalId = arrivals.some((arrival) => arrival.id === savedSelectedArrivalId)
        ? savedSelectedArrivalId
        : arrivals[0]?.id ?? '';

      setSelectedArrivalId(nextSelectedArrivalId);
    }
  }, [arrivals, selectedArrivalId, selectedStopId]);

  const handleStopSelect = (stopId: string) => {
    setSelectedStopId(stopId);
    setRecentStopIds((currentRecentStopIds) => [stopId, ...currentRecentStopIds.filter((id) => id !== stopId)].slice(0, 3));
    setActiveLine('all');
    setSelectedArrivalId(getInitialSelectedArrivalId(stopId, 'all'));
  };

  const handleFavoriteToggle = (stopId: string) => {
    setStops((currentStops) => {
      return sortStops(
        currentStops.map((stop) => (stop.id === stopId ? { ...stop, isFavorite: !stop.isFavorite } : stop)),
      );
    });
  };

  const renderStopCard = (stop: Stop) => {
    const isSelected = selectedStop?.id === stop.id;

    return (
      <article key={stop.id} className={`stop-card ${isSelected ? 'selected' : ''}`}>
        <div className="stop-card-top">
          <div>
            <strong>{stop.name}</strong>
            <span>{stop.area}</span>
          </div>
          <button
            type="button"
            className={`pin-toggle ${stop.isFavorite ? 'active' : ''}`}
            onClick={() => handleFavoriteToggle(stop.id)}
            aria-label={stop.isFavorite ? `Unpin ${stop.name}` : `Pin ${stop.name}`}
            aria-pressed={stop.isFavorite}
          >
            {stop.isFavorite ? 'Pinned' : 'Pin'}
          </button>
        </div>
        <span>Code {stop.code}</span>
        <span>Lines {stop.lines.join(', ')}</span>
        <button type="button" className="stop-select-button" onClick={() => handleStopSelect(stop.id)}>
          {isSelected ? 'Viewing board' : 'View board'}
        </button>
      </article>
    );
  };

  const renderArrivalCard = (arrival: Arrival) => {
    const isSelected = arrival.id === selectedArrival?.id;

    return (
      <button
        key={arrival.id}
        type="button"
        className={`arrival-card ${isSelected ? 'selected' : ''}`}
        onClick={() => setSelectedArrivalId(arrival.id)}
      >
        <div className="arrival-card-top">
          <div className="line-badge" style={{ backgroundColor: getRoute(arrival.routeId)?.color ?? '#0f172a' }}>
            {arrival.line}
          </div>
          <span className={`status-pill status-${arrival.status}`}>{statusLabels[arrival.status]}</span>
        </div>
        <strong>{arrival.destination}</strong>
        <div className="arrival-meta">
          <span>Expected {formatTime(arrival.expectedAt)}</span>
          <span>{getMinutesUntil(arrival.expectedAt)}</span>
        </div>
        <div className="arrival-meta muted">
          <span>Scheduled {formatTime(arrival.scheduledAt)}</span>
          <span>Platform {arrival.platform ?? 'TBD'}</span>
        </div>
        {arrival.disruptionNote ? <p className="disruption-note">{arrival.disruptionNote}</p> : null}
      </button>
    );
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mocked arrivals milestone</p>
          <h1>Public Transport Tracker</h1>
          <p className="page-subtitle">
            Browse saved and nearby stops, pin the places you care about most, inspect the next arrivals, and open the selected route without needing a live provider yet.
          </p>
        </div>
        <div className="summary-card">
          <span>{stops.length} stops</span>
          <span>{favoriteStops.length} pinned</span>
          <span>{snapshot.routes.length} routes</span>
          <span>{snapshot.arrivals.length} mock arrivals</span>
          <span>Updated {formatTime(snapshot.generatedAt)}</span>
        </div>
      </header>

      <main className="layout-grid">
        <aside className="panel stop-panel">
          <div className="panel-header">
            <h2>Stops</h2>
            <p>Pick a stop to view its arrival board and pin or unpin it from the list.</p>
          </div>

          <section className="stop-group">
            <div className="group-label">Pinned stops</div>
            <div className="stop-list">
              {favoriteStops.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <p>No pinned stops yet.</p>
                </div>
              ) : (
                favoriteStops.map(renderStopCard)
              )}
            </div>
          </section>

          <section className="stop-group">
            <div className="group-label">Recently viewed</div>
            <div className="stop-list">
              {recentStops.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <p>Your recently viewed stops will appear here.</p>
                </div>
              ) : (
                recentStops.map(renderStopCard)
              )}
            </div>
          </section>

          <section className="stop-group">
            <div className="group-label">Nearby stops</div>
            <div className="stop-list">
              {nearbyStops.length === 0 ? (
                <div className="empty-state compact-empty-state">
                  <p>All non-pinned stops are already in your recent list.</p>
                </div>
              ) : (
                nearbyStops.map(renderStopCard)
              )}
            </div>
          </section>
        </aside>

        <section className="panel arrivals-panel">
          <div className="panel-header panel-header-row">
            <div>
              <h2>{selectedStop.name}</h2>
              <p>
                {selectedStop.area} · Stop {selectedStop.code}
              </p>
            </div>
            <button
              type="button"
              className={`pin-toggle ${selectedStop.isFavorite ? 'active' : ''}`}
              onClick={() => handleFavoriteToggle(selectedStop.id)}
              aria-pressed={selectedStop.isFavorite}
            >
              {selectedStop.isFavorite ? 'Pinned stop' : 'Pin stop'}
            </button>
          </div>

          <div className="filter-toolbar" aria-label="Arrival line filters">
            <button
              type="button"
              className={`filter-chip ${activeLine === 'all' ? 'selected' : ''}`}
              onClick={() => setActiveLine('all')}
            >
              All lines
            </button>
            {availableLines.map((line) => (
              <button
                key={line}
                type="button"
                className={`filter-chip ${activeLine === line ? 'selected' : ''}`}
                onClick={() => setActiveLine(line)}
              >
                Line {line}
              </button>
            ))}
          </div>

          <div className="board-summary">
            <span>{arrivals.length} visible arrivals</span>
            <span>{activeLine === 'all' ? 'Showing every line' : `Filtered to line ${activeLine}`}</span>
          </div>

          <div className="arrival-list">
            {arrivals.length === 0 ? (
              <div className="empty-state">
                <h3>No arrivals</h3>
                <p>
                  {activeLine === 'all'
                    ? 'This stop has no mock arrivals yet.'
                    : `There are no visible arrivals for line ${activeLine} at this stop.`}
                </p>
              </div>
            ) : (
              arrivals.map(renderArrivalCard)
            )}
          </div>
        </section>

        <aside className="panel route-panel">
          {selectedArrival && selectedRoute ? (
            <>
              <div className="panel-header">
                <h2>Route {selectedRoute.line}</h2>
                <p>{selectedRoute.destination}</p>
              </div>

              <div className="route-highlight">
                <div className="line-badge large" style={{ backgroundColor: selectedRoute.color }}>
                  {selectedRoute.line}
                </div>
                <div>
                  <span className="detail-label">Selected arrival</span>
                  <strong>{formatTime(selectedArrival.expectedAt)} · {statusLabels[selectedArrival.status]}</strong>
                </div>
              </div>

              <div className="route-summary-grid">
                <div>
                  <span className="detail-label">Destination</span>
                  <strong>{selectedArrival.destination}</strong>
                </div>
                <div>
                  <span className="detail-label">Platform</span>
                  <strong>{selectedArrival.platform ?? 'TBD'}</strong>
                </div>
                <div>
                  <span className="detail-label">Scheduled</span>
                  <strong>{formatTime(selectedArrival.scheduledAt)}</strong>
                </div>
                <div>
                  <span className="detail-label">Expected</span>
                  <strong>{formatTime(selectedArrival.expectedAt)}</strong>
                </div>
              </div>

              {selectedArrival.disruptionNote ? (
                <div className="alert-card">
                  <span className="detail-label">Service note</span>
                  <strong>{selectedArrival.disruptionNote}</strong>
                </div>
              ) : null}

              <div className="route-stops">
                <h3>Ordered stops</h3>
                <div className="route-stop-list">
                  {selectedRoute.stops.map((stop) => (
                    <article key={stop.stopId} className={`route-stop ${stop.stopId === selectedStop.id ? 'current' : ''}`}>
                      <span className="route-stop-order">{stop.order}</span>
                      <div>
                        <strong>{stop.stopName}</strong>
                        <p>{stop.stopId === selectedStop.id ? 'Current board selection' : 'Served by this route'}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No route selected</h2>
              <p>Select an arrival from the board to inspect the route details.</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
