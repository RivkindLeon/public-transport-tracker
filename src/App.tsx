import { useEffect, useMemo, useState } from 'react';
import { getRoute, getStopArrivals, getTransportSnapshot } from './data/mockData';
import type { Arrival, ArrivalStatus } from './types';

const snapshot = getTransportSnapshot();

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
  const [selectedStopId, setSelectedStopId] = useState(snapshot.stops[0]?.id ?? '');
  const [activeLine, setActiveLine] = useState<'all' | string>('all');
  const stopArrivals = useMemo(() => getStopArrivals(selectedStopId), [selectedStopId]);
  const [selectedArrivalId, setSelectedArrivalId] = useState(stopArrivals[0]?.id ?? '');

  const selectedStop = snapshot.stops.find((stop) => stop.id === selectedStopId) ?? snapshot.stops[0];
  const availableLines = selectedStop?.lines ?? [];
  const arrivals = useMemo(
    () => (activeLine === 'all' ? stopArrivals : stopArrivals.filter((arrival) => arrival.line === activeLine)),
    [activeLine, stopArrivals],
  );
  const selectedArrival = arrivals.find((arrival) => arrival.id === selectedArrivalId) ?? arrivals[0];
  const selectedRoute = selectedArrival ? getRoute(selectedArrival.routeId) : undefined;

  const favoriteStops = snapshot.stops.filter((stop) => stop.isFavorite);
  const nearbyStops = snapshot.stops.filter((stop) => !stop.isFavorite);

  useEffect(() => {
    if (!availableLines.includes(activeLine)) {
      setActiveLine('all');
    }
  }, [activeLine, availableLines]);

  useEffect(() => {
    if (!arrivals.some((arrival) => arrival.id === selectedArrivalId)) {
      setSelectedArrivalId(arrivals[0]?.id ?? '');
    }
  }, [arrivals, selectedArrivalId]);

  const handleStopSelect = (stopId: string) => {
    setSelectedStopId(stopId);
    setActiveLine('all');
    const nextArrival = getStopArrivals(stopId)[0];
    setSelectedArrivalId(nextArrival?.id ?? '');
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
            Browse saved and nearby stops, inspect the next arrivals, and open the selected route without needing a live provider yet.
          </p>
        </div>
        <div className="summary-card">
          <span>{snapshot.stops.length} stops</span>
          <span>{snapshot.routes.length} routes</span>
          <span>{snapshot.arrivals.length} mock arrivals</span>
          <span>Updated {formatTime(snapshot.generatedAt)}</span>
        </div>
      </header>

      <main className="layout-grid">
        <aside className="panel stop-panel">
          <div className="panel-header">
            <h2>Stops</h2>
            <p>Pick a stop to view its arrival board.</p>
          </div>

          <section className="stop-group">
            <div className="group-label">Pinned stops</div>
            <div className="stop-list">
              {favoriteStops.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  className={`stop-card ${selectedStop?.id === stop.id ? 'selected' : ''}`}
                  onClick={() => handleStopSelect(stop.id)}
                >
                  <strong>{stop.name}</strong>
                  <span>{stop.area}</span>
                  <span>Code {stop.code}</span>
                  <span>Lines {stop.lines.join(', ')}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="stop-group">
            <div className="group-label">Nearby stops</div>
            <div className="stop-list">
              {nearbyStops.map((stop) => (
                <button
                  key={stop.id}
                  type="button"
                  className={`stop-card ${selectedStop?.id === stop.id ? 'selected' : ''}`}
                  onClick={() => handleStopSelect(stop.id)}
                >
                  <strong>{stop.name}</strong>
                  <span>{stop.area}</span>
                  <span>Code {stop.code}</span>
                  <span>Lines {stop.lines.join(', ')}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="panel arrivals-panel">
          <div className="panel-header">
            <h2>{selectedStop.name}</h2>
            <p>
              {selectedStop.area} · Stop {selectedStop.code}
            </p>
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
