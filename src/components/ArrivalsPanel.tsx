import type { Arrival, Stop } from '../types';
import { ArrivalCard } from './ArrivalCard';

type ArrivalsPanelProps = {
  selectedStop: Stop;
  activeLine: 'all' | string;
  availableLines: string[];
  arrivals: Arrival[];
  onActiveLineChange: (line: 'all' | string) => void;
  onFavoriteToggle: (stopId: string) => void;
  onArrivalSelect: (arrivalId: string) => void;
  selectedArrivalId: string;
};

export function ArrivalsPanel({
  selectedStop,
  activeLine,
  availableLines,
  arrivals,
  onActiveLineChange,
  onFavoriteToggle,
  onArrivalSelect,
  selectedArrivalId,
}: ArrivalsPanelProps) {
  return (
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
          onClick={() => onFavoriteToggle(selectedStop.id)}
          aria-pressed={selectedStop.isFavorite}
        >
          {selectedStop.isFavorite ? 'Pinned stop' : 'Pin stop'}
        </button>
      </div>

      <div className="filter-toolbar" aria-label="Arrival line filters">
        <button
          type="button"
          className={`filter-chip ${activeLine === 'all' ? 'selected' : ''}`}
          onClick={() => onActiveLineChange('all')}
        >
          All lines
        </button>
        {availableLines.map((line) => (
          <button
            key={line}
            type="button"
            className={`filter-chip ${activeLine === line ? 'selected' : ''}`}
            onClick={() => onActiveLineChange(line)}
          >
            Line {line}
          </button>
        ))}
      </div>

      <div className="board-summary">
        <span>{arrivals.length} visible arrivals</span>
        <span>
          {activeLine === 'all'
            ? 'Showing every line'
            : `Filtered to line ${activeLine}`}
        </span>
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
          arrivals.map((arrival) => (
            <ArrivalCard
              key={arrival.id}
              arrival={arrival}
              isSelected={arrival.id === selectedArrivalId}
              onSelect={onArrivalSelect}
            />
          ))
        )}
      </div>
    </section>
  );
}
