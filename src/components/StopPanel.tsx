import { maxRecentStops } from '../constants';
import type { Stop } from '../types';
import {
  formatRecentView,
  getRecentStopRouteSummary,
  type RecentStopView,
} from '../utils';
import { StopCard } from './StopCard';

type RecentStopEntry = RecentStopView & { stop: Stop };

type StopPanelProps = {
  favoriteStops: Stop[];
  nearbyStops: Stop[];
  recentStops: RecentStopEntry[];
  selectedStopId: string;
  onStopSelect: (stopId: string) => void;
  onFavoriteToggle: (stopId: string) => void;
  onRecentHistoryClear: () => void;
  onRecentStopDismiss: (stopId: string) => void;
};

export function StopPanel({
  favoriteStops,
  nearbyStops,
  recentStops,
  selectedStopId,
  onStopSelect,
  onFavoriteToggle,
  onRecentHistoryClear,
  onRecentStopDismiss,
}: StopPanelProps) {
  const renderStopCard = (
    stop: Stop,
    options?: {
      metaLabel?: string;
      detailLabel?: string;
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
        <div className="board-summary recent-history-summary">
          <span>{recentStops.length} saved recent stops</span>
          <span>
            {recentStops.length === maxRecentStops
              ? 'History is full'
              : `${maxRecentStops - recentStops.length} open slots left`}
          </span>
        </div>
        <div className="stop-list">
          {recentStops.length === 0 ? (
            <div className="empty-state compact-empty-state">
              <p>Your recently viewed stops will appear here.</p>
            </div>
          ) : (
            recentStops.map(({ stop, viewedAt }) =>
              renderStopCard(stop, {
                metaLabel: formatRecentView(viewedAt),
                detailLabel: getRecentStopRouteSummary(stop.id),
                onDismiss: () => onRecentStopDismiss(stop.id),
              }),
            )
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
