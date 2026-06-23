import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Arrival, Stop, BoardView, LineFilter } from '../types';
import { ArrivalsPanel } from './ArrivalsPanel';

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

function makeArrival(overrides: Partial<Arrival> = {}): Arrival {
  return {
    id: 'arr-1',
    stopId: 'stop-central',
    routeId: 'route-10',
    line: '10',
    destination: 'Harbor Terminal',
    scheduledAt: '2026-06-23T17:00:00.000Z',
    expectedAt: '2026-06-23T17:05:00.000Z',
    status: 'on-time',
    platform: 'A1',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

function renderPanel({
  selectedStop = centralStation,
  activeLine = 'all' as LineFilter,
  boardView = 'all' as BoardView,
  arrivals = [makeArrival()],
  totalArrivals = 1,
  disruptedCount = 0,
  selectedArrivalId = '',
  onActiveLineChange = vi.fn(),
  onBoardViewChange = vi.fn(),
  onFavoriteToggle = vi.fn(),
  onArrivalSelect = vi.fn(),
} = {}) {
  return render(
    <ArrivalsPanel
      selectedStop={selectedStop}
      activeLine={activeLine}
      availableLines={selectedStop.lines}
      boardView={boardView}
      arrivals={arrivals}
      totalArrivals={totalArrivals}
      disruptedCount={disruptedCount}
      onActiveLineChange={onActiveLineChange}
      onBoardViewChange={onBoardViewChange}
      onFavoriteToggle={onFavoriteToggle}
      onArrivalSelect={onArrivalSelect}
      selectedArrivalId={selectedArrivalId}
    />,
  );
}

describe('ArrivalsPanel', () => {
  describe('header', () => {
    it('renders the stop name, area, and code', () => {
      renderPanel();

      expect(screen.getByText('Central Station')).toBeInTheDocument();
      expect(screen.getByText(/Downtown/)).toBeInTheDocument();
      expect(screen.getByText(/1001/)).toBeInTheDocument();
    });

    it('renders a pinned state button when the stop is favorited', () => {
      renderPanel({ selectedStop: centralStation });

      const pinBtn = screen.getByRole('button', { name: /pinned stop/i });
      expect(pinBtn).toBeInTheDocument();
      expect(pinBtn).toHaveAttribute('aria-pressed', 'true');
      expect(pinBtn).toHaveClass('active');
    });

    it('renders an unpinned button when the stop is not favorited', () => {
      renderPanel({ selectedStop: marketStreet });

      const pinBtn = screen.getByRole('button', { name: /pin stop/i });
      expect(pinBtn).toBeInTheDocument();
      expect(pinBtn).toHaveAttribute('aria-pressed', 'false');
      expect(pinBtn).not.toHaveClass('active');
    });

    it('calls onFavoriteToggle when the pin button is clicked', () => {
      const onFavoriteToggle = vi.fn();

      renderPanel({ onFavoriteToggle });

      fireEvent.click(screen.getByRole('button', { name: /pinned stop/i }));
      expect(onFavoriteToggle).toHaveBeenCalledWith('stop-central');
    });
  });

  describe('line filters', () => {
    it('renders "All lines" and a button for each available line', () => {
      renderPanel();

      expect(
        screen.getByRole('button', { name: /all lines/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /line 10/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /line 18/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /line 42/i }),
      ).toBeInTheDocument();
    });

    it('marks the active line chip as selected', () => {
      renderPanel({ activeLine: '18' });

      expect(screen.getByRole('button', { name: /line 18/i })).toHaveClass(
        'selected',
      );
      expect(
        screen.getByRole('button', { name: /all lines/i }),
      ).not.toHaveClass('selected');
    });

    it('calls onActiveLineChange when a line chip is clicked', () => {
      const onActiveLineChange = vi.fn();

      renderPanel({ onActiveLineChange });

      fireEvent.click(screen.getByRole('button', { name: /line 10/i }));
      expect(onActiveLineChange).toHaveBeenCalledWith('10');
    });

    it('calls onActiveLineChange with "all" when the All lines chip is clicked', () => {
      const onActiveLineChange = vi.fn();

      renderPanel({ activeLine: '18', onActiveLineChange });

      fireEvent.click(screen.getByRole('button', { name: /all lines/i }));
      expect(onActiveLineChange).toHaveBeenCalledWith('all');
    });
  });

  describe('board view controls', () => {
    it('renders buttons for all three board views', () => {
      renderPanel();

      expect(
        screen.getByRole('button', { name: /full board/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /disruptions only/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /smooth trips/i }),
      ).toBeInTheDocument();
    });

    it('shows the disrupted count in the disruptions button', () => {
      renderPanel({ disruptedCount: 3, totalArrivals: 10, arrivals: [] });

      expect(
        screen.getByRole('button', { name: /disruptions only · 3/i }),
      ).toBeInTheDocument();
    });

    it('shows the smooth count in the smooth trips button', () => {
      renderPanel({ disruptedCount: 3, totalArrivals: 10, arrivals: [] });

      expect(
        screen.getByRole('button', { name: /smooth trips · 7/i }),
      ).toBeInTheDocument();
    });

    it('marks the currently selected board view', () => {
      renderPanel({ boardView: 'disrupted' });

      expect(
        screen.getByRole('button', { name: /disruptions only/i }),
      ).toHaveClass('selected');
      expect(
        screen.getByRole('button', { name: /full board/i }),
      ).not.toHaveClass('selected');
    });

    it('calls onBoardViewChange when a view chip is clicked', () => {
      const onBoardViewChange = vi.fn();

      renderPanel({ onBoardViewChange });

      fireEvent.click(
        screen.getByRole('button', { name: /disruptions only/i }),
      );
      expect(onBoardViewChange).toHaveBeenCalledWith('disrupted');

      fireEvent.click(screen.getByRole('button', { name: /full board/i }));
      expect(onBoardViewChange).toHaveBeenCalledWith('all');
    });
  });

  describe('board summary', () => {
    it('shows arrival count and default description for full board, all lines', () => {
      renderPanel({
        arrivals: [makeArrival(), makeArrival({ id: 'arr-2' })],
        totalArrivals: 5,
      });

      expect(screen.getByText(/2 visible arrivals/)).toBeInTheDocument();
      expect(screen.getByText(/showing every line/i)).toBeInTheDocument();
    });

    it('shows line-filtered description when a specific line is active', () => {
      renderPanel({ activeLine: '18' });

      expect(screen.getByText(/filtered to line 18/i)).toBeInTheDocument();
    });

    it('shows disrupted-focused description in disrupted view', () => {
      renderPanel({ boardView: 'disrupted' });

      expect(
        screen.getByText(/focusing on delayed and cancelled service/i),
      ).toBeInTheDocument();
    });

    it('shows smooth-focused description in smooth view', () => {
      renderPanel({ boardView: 'smooth' });

      expect(
        screen.getByText(/showing on-time and boarding trips only/i),
      ).toBeInTheDocument();
    });
  });

  describe('arrival cards', () => {
    it('renders an ArrivalCard for each arrival', () => {
      const arrivals = [
        makeArrival({
          id: 'arr-1',
          destination: 'Harbor Terminal',
          line: '10',
          status: 'on-time',
        }),
        makeArrival({
          id: 'arr-2',
          destination: 'City Campus',
          line: '18',
          status: 'delayed',
        }),
      ];

      renderPanel({ arrivals });

      expect(screen.getByText('Harbor Terminal')).toBeInTheDocument();
      expect(screen.getByText('City Campus')).toBeInTheDocument();
    });

    it('marks the selected arrival', () => {
      const arrivals = [
        makeArrival({
          id: 'arr-1',
          line: '10',
          destination: 'Harbor Terminal',
        }),
        makeArrival({ id: 'arr-2', line: '18', destination: 'City Campus' }),
      ];

      renderPanel({ arrivals, selectedArrivalId: 'arr-2' });

      // The selected arrival card should have the 'selected' class.
      // Find it by its destination text (unique to the arrival card).
      const selectedCard = screen.getByText('City Campus').closest('button');
      expect(selectedCard).toHaveClass('selected');

      // The non-selected arrival card should not have the 'selected' class.
      const unselectedCard = screen
        .getByText('Harbor Terminal')
        .closest('button');
      expect(unselectedCard).not.toHaveClass('selected');
    });

    it('calls onArrivalSelect when an arrival card is clicked', () => {
      const onArrivalSelect = vi.fn();
      const arrivals = [makeArrival({ id: 'arr-1' })];

      renderPanel({ arrivals, onArrivalSelect });

      const card = screen.getByRole('button', { name: /harbor terminal/i });
      fireEvent.click(card);
      expect(onArrivalSelect).toHaveBeenCalledWith('arr-1');
    });
  });

  describe('empty states', () => {
    it('shows generic empty state when boardView is "all" and line is "all"', () => {
      renderPanel({ arrivals: [], boardView: 'all', activeLine: 'all' });

      const section = screen.getByRole('heading', {
        name: 'No arrivals',
      });
      expect(section).toBeInTheDocument();
      expect(
        screen.getByText(/this stop has no mock arrivals yet/i),
      ).toBeInTheDocument();
    });

    it('shows empty state specific to line filter when a line is active', () => {
      renderPanel({ arrivals: [], activeLine: '42' });

      expect(
        screen.getByText(/no visible arrivals for line 42/i),
      ).toBeInTheDocument();
    });

    it('shows empty state specific to disrupted view', () => {
      renderPanel({ arrivals: [], boardView: 'disrupted' });

      expect(
        screen.getByText(
          /there are no delayed or cancelled arrivals in this board view/i,
        ),
      ).toBeInTheDocument();
    });

    it('shows empty state specific to smooth view', () => {
      renderPanel({ arrivals: [], boardView: 'smooth' });

      expect(
        screen.getByText(
          /there are no on-time or boarding arrivals in this board view/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
