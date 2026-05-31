import { getRoute } from '../data/mockData';
import { statusLabels } from '../constants';
import type { Arrival } from '../types';
import { formatTime, getMinutesUntil } from '../utils';

type ArrivalCardProps = {
  arrival: Arrival;
  isSelected: boolean;
  onSelect: (arrivalId: string) => void;
};

export function ArrivalCard({ arrival, isSelected, onSelect }: ArrivalCardProps) {
  return (
    <button
      type="button"
      className={`arrival-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(arrival.id)}
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
}
