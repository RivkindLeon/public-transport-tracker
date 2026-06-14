import { statusLabels } from '../constants';
import type { Arrival, Route, Stop } from '../types';
import { formatTime } from '../utils/time';

type RoutePanelProps = {
  selectedArrival?: Arrival;
  selectedRoute?: Route;
  selectedStop: Stop;
};

export function RoutePanel({
  selectedArrival,
  selectedRoute,
  selectedStop,
}: RoutePanelProps) {
  return (
    <aside className="panel route-panel">
      {selectedArrival && selectedRoute ? (
        <>
          <div className="panel-header">
            <h2>Route {selectedRoute.line}</h2>
            <p>{selectedRoute.destination}</p>
          </div>

          <div className="route-highlight">
            <div
              className="line-badge large"
              style={{ backgroundColor: selectedRoute.color }}
            >
              {selectedRoute.line}
            </div>
            <div>
              <span className="detail-label">Selected arrival</span>
              <strong>
                {formatTime(selectedArrival.expectedAt)} ·{' '}
                {statusLabels[selectedArrival.status]}
              </strong>
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
                <article
                  key={stop.stopId}
                  className={`route-stop ${stop.stopId === selectedStop.id ? 'current' : ''}`}
                >
                  <span className="route-stop-order">{stop.order}</span>
                  <div>
                    <strong>{stop.stopName}</strong>
                    <p>
                      {stop.stopId === selectedStop.id
                        ? 'Current board selection'
                        : 'Served by this route'}
                    </p>
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
  );
}
