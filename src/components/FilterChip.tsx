import type { ReactNode } from 'react';

type FilterChipProps = {
  /** The current active value of the filter group. */
  active: string;
  /** The value this chip represents. */
  value: string;
  /** Display label. */
  label: ReactNode;
  /** Apply the alert (red) style variant. */
  alert?: boolean;
  /** Called when this chip is clicked. */
  onSelect: (value: string) => void;
};

/**
 * Reusable filter-chip button used in toolbar groups across panels.
 *
 * Renders a `<button>` that is visually highlighted when `active === value`.
 * The `alert` prop adds a separate tone variant for disruption-related toggles.
 */
export function FilterChip({
  active,
  value,
  label,
  alert = false,
  onSelect,
}: FilterChipProps) {
  const className = [
    'filter-chip',
    alert ? 'filter-chip-alert' : null,
    active === value ? 'selected' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      onClick={() => onSelect(value)}
    >
      {label}
    </button>
  );
}