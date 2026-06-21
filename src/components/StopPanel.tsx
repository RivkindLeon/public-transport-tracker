import { maxRecentStops } from '../constants';
import type {
  RecentStopEntry,
  RecentStopFilter,
  RecentStopSort,
  Stop,
} from '../types';
import { formatRecentView } from '../utils/time';
import {
  getRecentStopDisruptionSummary,
  getRecentStopRouteSummary,
} from '../utils/recentStops';
import { StopCard } from './StopCard';

type StopPanelProps = {
  favoriteStops: Stop[];
  nearbyStops: Stop[];
  recentStops: RecentStopEntry[];
  selectedStopId: string;
  recentStopFilter: RecentStopFilter;
  recentStopSort: RecentStopSort;
  onStopSelect: (stopId: string) => void;
  onFavoriteToggle: (stopId: string) => void;
  onRecentHistoryClear: () => void;
  onRecentStopDismiss: (stopId: string) => void;
  onRecentStopFilterChange: (filter: RecentStopFilter) => void;
  onRecentStopSortChange: (sort: RecentStopSort) => void;
};

export function StopPanel({
  favoriteStops,
  nearbyStops,
  recentStops,
  selectedStopId,
  recentStopFilter,
  recentStopSort,
  onStopSelect,
  onFavoriteToggle,
  onRecentHistoryClear,
  onRecentStopDismiss,
  onRecentStopFilterChange,
  onRecentStopSortChange,
}: StopPanelProps) {
  const renderStopCard = (
    stop: Stop,
    options?: {
      metaLabel?: string;
      detailLabel?: string;
      insightLabel?: string;
      insightTone?: 'calm' | 'warning';
      onDismiss?: () => void;
    },
  ) => (
    <StopCard
      key={stop.id}
      stop={stop}
      isSelected={selectedStopId === stop.id}
      onSelect={onStopSelect}
      onFavoriteToggle={onFavoriteToggle}
      metaLabel={options?.metaLabel}
      detailLabel={options?.detailLabel}
      insightLabel={options?.insightLabel}
      insightTone={options?.insightTone}
      onDismiss={options?.onDismiss}
    />
  );

  return (
    <aside className="panel stop-panel">
      <div className="panel-header">
        <h2>Stops</h2>
        <p>
          Pick a stop to view its arrival board and pin or unpin it from the
          list.
        </p>
      </div>

      <section className="stop-group">
        <div className="group-label">Pinned stops</div>
        <div className="stop-list">
          {favoriteStops.length === 0 ? (
            <div className="empty-state compact-empty-state">
              <p>No pinned stops yet.</p>
            </div>
          ) : (
            favoriteStops.map((stop) => renderStopCard(stop))
          )}
        </div>
      </section>

      <section className="stop-group">
        <div className="group-header">
          <div>
            <div className="group-label">Recently viewed</div>
            <p className="group-caption">
              Keeping your last {maxRecentStops} boards ready. Oldest stops drop
              off automatically once the list is full.
            </p>
          </div>
          {recentStops.length > 0 ? (
            <button
              type="button"
              className="inline-action-button"
              onClick={onRecentHistoryClear}
            >
              Clear history
            </button>
          ) : null}
        </div>
        <div className="filter-toolbar compact-filter-toolbar">
          <button
            type="button"
            className={`filter-chip ${recentStopFilter === 'all' ? 'selected' : ''}`}
            onClick={() => onRecentStopFilterChange('all')}
          >
            All recent stops
          </button>
          <button
            type="button"
            className={`filter-chip filter-chip-alert ${recentStopFilter === 'disrupted' ? 'selected' : ''}`}
            onClick={() => onRecentStopFilterChange('disrupted')}
          >
            Disruptions only
          </button>
          <button
            type="button"
            className={`filter-chip ${recentStopSort === 'recent' ? 'selected' : ''}`}
            onClick={() => onRecentStopSortChange('recent')}
          >
            Latest viewed
          </button>
          <button
            type="button"
            className={`filter-chip ${recentStopSort === 'urgent' ? 'selected' : ''}`}
            onClick={() => onRecentStopSortChange('urgent')}
          >
            Urgent first
          </button>
        </div>
        <div className="board-summary recent-history-summary">
          <span>{recentStops.length} visible recent stops</span>
          <span>
            {recentStopFilter === 'disrupted'
              ? 'Showing only saved boards with delays or cancellations'
              : recentStops.length === maxRecentStops
                ? 'History is full'
                : `${maxRecentStops - recentStops.length} open slots left`}
          </span>
        </div>
        <div className="stop-list">
          {recentStops.length === 0 ? (
            <div className="empty-state compact-empty-state">
              <p>
                {recentStopFilter === 'disrupted'
                  ? 'No saved recent stops currently have delays or cancellations.'
                  : 'Your recently viewed stops will appear here.'}
              </p>
            </div>
          ) : (
            recentStops.map(({ stop, viewedAt }) => {
              const disruptionSummary = getRecentStopDisruptionSummary(stop.id);

              return renderStopCard(stop, {
                metaLabel: formatRecentView(viewedAt),
                detailLabel: getRecentStopRouteSummary(stop.id),
                onDismiss: () => onRecentStopDismiss(stop.id),
                insightLabel: disruptionSummary.label,
                insightTone: disruptionSummary.tone,
              });
            })
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
            nearbyStops.map((stop) => renderStopCard(stop))
          )}
        </div>
      </section>
    </aside>
  );
}
