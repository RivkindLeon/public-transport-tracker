import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type {
  Stop,
  RecentStopEntry,
  RecentStopFilter,
  RecentStopSort,
} from '../types';
import { StopPanel } from './StopPanel';

const centralStation: Stop = {
  id: 'stop-central',
  name: 'Central Station',
  code: '1001',
  area: 'Downtown',
  lines: ['10', '18', '42'],
  isFavorite: true,
};

const marketStreet: Stop = {
  id: 'stop-market',
  name: 'Market Street',
  code: '1002',
  area: 'Downtown',
  lines: ['10', '27'],
  isFavorite: false,
};

const stadiumStop: Stop = {
  id: 'stop-stadium',
  name: 'Sports Stadium',
  code: '1003',
  area: 'East Side',
  lines: ['18', 'E1'],
  isFavorite: false,
};

const parkStop: Stop = {
  id: 'stop-park',
  name: 'City Park',
  code: '1004',
  area: 'North District',
  lines: ['27', '42'],
  isFavorite: true,
};

function makeRecentEntry(
  overrides: Partial<RecentStopEntry> = {},
): RecentStopEntry {
  return {
    stop: parkStop,
    viewedAt: '2026-07-09T17:30:00.000Z',
    stopId: parkStop.id,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

type RenderPanelProps = {
  favoriteStops?: Stop[];
  nearbyStops?: Stop[];
  recentStops?: RecentStopEntry[];
  selectedStopId?: string;
  recentStopFilter?: RecentStopFilter;
  recentStopSort?: RecentStopSort;
  onStopSelect?: (stopId: string) => void;
  onFavoriteToggle?: (stopId: string) => void;
  onRecentHistoryClear?: () => void;
  onRecentStopDismiss?: (stopId: string) => void;
  onRecentStopFilterChange?: (filter: RecentStopFilter) => void;
  onRecentStopSortChange?: (sort: RecentStopSort) => void;
};

function renderPanel({
  favoriteStops = [centralStation, parkStop],
  nearbyStops = [marketStreet],
  recentStops = [makeRecentEntry()],
  selectedStopId = '',
  recentStopFilter = 'all',
  recentStopSort = 'recent',
  onStopSelect = vi.fn(),
  onFavoriteToggle = vi.fn(),
  onRecentHistoryClear = vi.fn(),
  onRecentStopDismiss = vi.fn(),
  onRecentStopFilterChange = vi.fn(),
  onRecentStopSortChange = vi.fn(),
}: RenderPanelProps = {}) {
  return render(
    <StopPanel
      favoriteStops={favoriteStops}
      nearbyStops={nearbyStops}
      recentStops={recentStops}
      selectedStopId={selectedStopId}
      recentStopFilter={recentStopFilter}
      recentStopSort={recentStopSort}
      onStopSelect={onStopSelect}
      onFavoriteToggle={onFavoriteToggle}
      onRecentHistoryClear={onRecentHistoryClear}
      onRecentStopDismiss={onRecentStopDismiss}
      onRecentStopFilterChange={onRecentStopFilterChange}
      onRecentStopSortChange={onRecentStopSortChange}
    />,
  );
}

describe('StopPanel', () => {
  describe('panel header', () => {
    it('renders the panel header with title', () => {
      renderPanel();

      expect(
        screen.getByRole('heading', { name: /stops/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /pick a stop to view its arrival board and pin or unpin it/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('pinned stops section', () => {
    it('renders favorite stops as stop cards', () => {
      renderPanel({
        favoriteStops: [centralStation, parkStop],
        nearbyStops: [],
        recentStops: [],
      });

      expect(screen.getByText('Central Station')).toBeInTheDocument();
      expect(screen.getByText('City Park')).toBeInTheDocument();
      expect(screen.getByText('Code 1004')).toBeInTheDocument();
    });

    it('shows empty state when there are no pinned stops', () => {
      renderPanel({
        favoriteStops: [],
        nearbyStops: [centralStation, marketStreet],
        recentStops: [],
      });

      expect(screen.getByText(/no pinned stops yet/i)).toBeInTheDocument();
    });

    it('highlights the selected stop among pinned stops', () => {
      const { container } = render(
        <StopPanel
          favoriteStops={[centralStation, parkStop]}
          nearbyStops={[marketStreet]}
          recentStops={[]}
          selectedStopId={'stop-central'}
          recentStopFilter={'all'}
          recentStopSort={'recent'}
          onStopSelect={vi.fn()}
          onFavoriteToggle={vi.fn()}
          onRecentHistoryClear={vi.fn()}
          onRecentStopDismiss={vi.fn()}
          onRecentStopFilterChange={vi.fn()}
          onRecentStopSortChange={vi.fn()}
        />,
      );

      const selectedArticles = container.querySelectorAll('article.selected');
      expect(selectedArticles.length).toBe(1);
    });
  });

  describe('recently viewed section', () => {
    it('renders recent stops with meta label', () => {
      renderPanel({
        favoriteStops: [centralStation],
        nearbyStops: [],
        recentStops: [makeRecentEntry({ stop: stadiumStop })],
      });

      expect(screen.getByText('Sports Stadium')).toBeInTheDocument();
      expect(screen.getByText('Code 1003')).toBeInTheDocument();
      // Verify a recent-stop-meta element exists with "viewed" text
      const metaSpans = screen
        .getAllByText(/viewed/i)
        .filter((el) => el.classList.contains('recent-stop-meta'));
      expect(metaSpans.length).toBe(1);
      expect(metaSpans[0]).toHaveTextContent(/viewed/i);
    });

    it('shows empty state when there are no recent stops', () => {
      renderPanel({
        recentStops: [],
      });

      expect(
        screen.getByText(/your recently viewed stops will appear here/i),
      ).toBeInTheDocument();
    });

    it('shows disrupted-specific empty state when filter is "disrupted"', () => {
      renderPanel({
        recentStopFilter: 'disrupted',
        recentStops: [],
      });

      expect(
        screen.getByText(
          /no saved recent stops currently have delays or cancellations/i,
        ),
      ).toBeInTheDocument();
    });

    it('shows the clear history button when recent stops exist', () => {
      renderPanel({
        recentStops: [makeRecentEntry()],
      });

      expect(
        screen.getByRole('button', { name: /clear history/i }),
      ).toBeInTheDocument();
    });

    it('hides the clear history button when there are no recent stops', () => {
      renderPanel({
        recentStops: [],
      });

      expect(
        screen.queryByRole('button', { name: /clear history/i }),
      ).not.toBeInTheDocument();
    });

    it('calls onRecentHistoryClear when clear history is clicked', () => {
      const onClear = vi.fn();

      renderPanel({
        onRecentHistoryClear: onClear,
      });

      const clearBtn = screen.getByRole('button', { name: /clear history/i });
      fireEvent.click(clearBtn);
      expect(onClear).toHaveBeenCalledOnce();
    });

    it('calls onRecentStopDismiss when a stop is dismissed', () => {
      const onDismiss = vi.fn();

      renderPanel({
        recentStops: [makeRecentEntry({ stop: parkStop })],
        onRecentStopDismiss: onDismiss,
      });

      const dismissBtn = screen.getByRole('button', {
        name: /remove city park from recent history/i,
      });
      fireEvent.click(dismissBtn);
      expect(onDismiss).toHaveBeenCalledWith('stop-park');
    });
  });

  describe('filter toolbar', () => {
    it('renders all filter and sort chips', () => {
      renderPanel();

      expect(
        screen.getByRole('button', { name: /all recent stops/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /disruptions only/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /latest viewed/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /urgent first/i }),
      ).toBeInTheDocument();
    });

    it('marks the active filter chip as selected', () => {
      renderPanel({ recentStopFilter: 'disrupted' });

      expect(
        screen.getByRole('button', { name: /disruptions only/i }),
      ).toHaveClass('selected');
      expect(
        screen.getByRole('button', { name: /all recent stops/i }),
      ).not.toHaveClass('selected');
    });

    it('calls onRecentStopFilterChange with "all" when All recent stops chip is clicked', () => {
      const onFilterChange = vi.fn();

      renderPanel({
        recentStopFilter: 'disrupted',
        onRecentStopFilterChange: onFilterChange,
      });

      fireEvent.click(
        screen.getByRole('button', { name: /all recent stops/i }),
      );
      expect(onFilterChange).toHaveBeenCalledWith('all');
    });

    it('calls onRecentStopFilterChange with "disrupted" when Disruptions only chip is clicked', () => {
      const onFilterChange = vi.fn();

      renderPanel({
        recentStopFilter: 'all',
        onRecentStopFilterChange: onFilterChange,
      });

      fireEvent.click(
        screen.getByRole('button', { name: /disruptions only/i }),
      );
      expect(onFilterChange).toHaveBeenCalledWith('disrupted');
    });

    it('marks the active sort chip as selected', () => {
      renderPanel({ recentStopSort: 'urgent' });

      expect(screen.getByRole('button', { name: /urgent first/i })).toHaveClass(
        'selected',
      );
      expect(
        screen.getByRole('button', { name: /latest viewed/i }),
      ).not.toHaveClass('selected');
    });

    it('calls onRecentStopSortChange with "recent" when Latest viewed chip is clicked', () => {
      const onSortChange = vi.fn();

      renderPanel({
        recentStopSort: 'urgent',
        onRecentStopSortChange: onSortChange,
      });

      fireEvent.click(screen.getByRole('button', { name: /latest viewed/i }));
      expect(onSortChange).toHaveBeenCalledWith('recent');
    });

    it('calls onRecentStopSortChange with "urgent" when Urgent first chip is clicked', () => {
      const onSortChange = vi.fn();

      renderPanel({
        recentStopSort: 'recent',
        onRecentStopSortChange: onSortChange,
      });

      fireEvent.click(screen.getByRole('button', { name: /urgent first/i }));
      expect(onSortChange).toHaveBeenCalledWith('urgent');
    });
  });

  describe('board summary', () => {
    it('shows recent stop count', () => {
      renderPanel({
        recentStops: [makeRecentEntry()],
      });

      expect(screen.getByText(/1 visible recent stop/)).toBeInTheDocument();
    });

    it('shows disruption-specific description when disrupted filter is active', () => {
      renderPanel({
        recentStopFilter: 'disrupted',
        recentStops: [makeRecentEntry()],
      });

      expect(
        screen.getByText(/showing only saved boards with delays/i),
      ).toBeInTheDocument();
    });

    it('shows history is full when at max capacity', () => {
      // maxRecentStops is 5 — create 5 entries
      const recentStops = Array.from({ length: 5 }, (_, i) =>
        makeRecentEntry({
          stop: { ...parkStop, id: `stop-${i}`, name: `Stop ${i}` },
          stopId: `stop-${i}`,
        }),
      );

      renderPanel({ recentStops });

      expect(screen.getByText(/history is full/i)).toBeInTheDocument();
    });
  });

  describe('nearby stops section', () => {
    it('renders nearby stops as stop cards', () => {
      renderPanel({
        nearbyStops: [marketStreet, stadiumStop],
      });

      expect(screen.getByText('Market Street')).toBeInTheDocument();
      expect(screen.getByText('Sports Stadium')).toBeInTheDocument();
      expect(screen.getByText('Code 1003')).toBeInTheDocument();
    });

    it('shows empty state when no nearby stops are available', () => {
      renderPanel({
        favoriteStops: [],
        nearbyStops: [],
        recentStops: [],
      });

      expect(
        screen.getByText(
          /all non-pinned stops are already in your recent list/i,
        ),
      ).toBeInTheDocument();
    });
  });

  describe('stop selection callbacks', () => {
    it('calls onStopSelect when a pinned stop card view-board button is clicked', () => {
      const onStopSelect = vi.fn();

      renderPanel({
        favoriteStops: [centralStation],
        nearbyStops: [],
        recentStops: [],
        onStopSelect,
      });

      const viewBtn = screen.getByRole('button', { name: /view board/i });
      fireEvent.click(viewBtn);
      expect(onStopSelect).toHaveBeenCalledWith('stop-central');
    });

    it('calls onFavoriteToggle when pin button is clicked on a pinned stop', () => {
      const onToggle = vi.fn();

      renderPanel({
        favoriteStops: [centralStation],
        nearbyStops: [],
        recentStops: [],
        onFavoriteToggle: onToggle,
      });

      const pinBtn = screen.getByRole('button', {
        name: /unpin central station/i,
      });
      fireEvent.click(pinBtn);
      expect(onToggle).toHaveBeenCalledWith('stop-central');
    });
  });

  describe('section labels', () => {
    it('renders "Pinned stops" label', () => {
      renderPanel();

      expect(screen.getByText(/pinned stops/i)).toBeInTheDocument();
    });

    it('renders "Recently viewed" label', () => {
      renderPanel();

      expect(screen.getByText(/recently viewed/i)).toBeInTheDocument();
    });

    it('renders "Nearby stops" label', () => {
      renderPanel();

      expect(screen.getByText(/nearby stops/i)).toBeInTheDocument();
    });
  });
});
