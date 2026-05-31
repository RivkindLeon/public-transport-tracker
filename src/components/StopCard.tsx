import type { Stop } from '../types';

type StopCardProps = {
  stop: Stop;
  isSelected: boolean;
  onSelect: (stopId: string) => void;
  onFavoriteToggle: (stopId: string) => void;
  metaLabel?: string;
  detailLabel?: string;
  onDismiss?: () => void;
};

export function StopCard({
  stop,
  isSelected,
  onSelect,
  onFavoriteToggle,
  metaLabel,
  detailLabel,
  onDismiss,
}: StopCardProps) {
  return (
    <article className={`stop-card ${isSelected ? 'selected' : ''}`}>
      <div className="stop-card-top">
        <div>
          <strong>{stop.name}</strong>
          <span>{stop.area}</span>
        </div>
        <div className="stop-card-actions">
          {onDismiss ? (
            <button
              type="button"
              className="inline-action-button"
              onClick={onDismiss}
              aria-label={`Remove ${stop.name} from recent history`}
            >
              Remove
            </button>
          ) : null}
          <button
            type="button"
            className={`pin-toggle ${stop.isFavorite ? 'active' : ''}`}
            onClick={() => onFavoriteToggle(stop.id)}
            aria-label={
              stop.isFavorite ? `Unpin ${stop.name}` : `Pin ${stop.name}`
            }
            aria-pressed={stop.isFavorite}
          >
            {stop.isFavorite ? 'Pinned' : 'Pin'}
          </button>
        </div>
      </div>
      <span>Code {stop.code}</span>
      <span>Lines {stop.lines.join(', ')}</span>
      {metaLabel ? <span className="recent-stop-meta">{metaLabel}</span> : null}
      {detailLabel ? (
        <span className="recent-stop-detail">{detailLabel}</span>
      ) : null}
      <button
        type="button"
        className="stop-select-button"
        onClick={() => onSelect(stop.id)}
      >
        {isSelected ? 'Viewing board' : 'View board'}
      </button>
    </article>
  );
}
