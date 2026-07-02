import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { Arrival, Route, Stop } from '../types';
import { RoutePanel } from './RoutePanel';
import { ArrivalCard } from './ArrivalCard';

// --- RoutePanel tests ---

const centralStation: Stop = {
  id: 'stop-central',
  name: 'Central Station',
  code: '1001',
  area: 'Downtown',
  lines: ['10', '18', '42'],
  isFavorite: true,
};

const route10: Route = {
  id: 'route-10',
  line: '10',
  destination: 'Harbor Terminal',
  color: '#38bdf8',
  stops: [
    { stopId: 'stop-central', stopName: 'Central Station', order: 1 },
    { stopId: 'stop-market', stopName: 'Market Street', order: 2 },
    { stopId: 'stop-hospital', stopName: 'General Hospital', order: 3 },
    { stopId: 'stop-harbor', stopName: 'Harbor Terminal', order: 4 },
  ],
};

function makeArrival(overrides: Partial<Arrival> = {}): Arrival {
  return {
    id: 'arr-1',
    stopId: 'stop-central',
    routeId: 'route-10',
    line: '10',
    destination: 'Harbor Terminal',
    scheduledAt: '2026-07-02T14:00:00.000Z',
    expectedAt: '2026-07-02T14:05:00.000Z',
    status: 'on-time',
    platform: 'A1',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe('RoutePanel', () => {
  describe('empty state', () => {
    it('shows empty state when no arrival or route is selected', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={undefined}
          selectedRoute={undefined}
        />,
      );

      expect(
        screen.getByRole('heading', { name: /no route selected/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/select an arrival from the board/i),
      ).toBeInTheDocument();
    });
  });

  describe('route header', () => {
    it('renders the route heading with line number', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival()}
          selectedRoute={route10}
        />,
      );

      const heading = screen.getByRole('heading', { name: /route 10/i });
      expect(heading).toBeInTheDocument();
    });

    it('renders the destination in the header', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival()}
          selectedRoute={route10}
        />,
      );

      const destinations = screen.getAllByText('Harbor Terminal');
      expect(destinations.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('route highlight', () => {
    it('renders the line badge with correct color', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival()}
          selectedRoute={route10}
        />,
      );

      const badge = screen.getByText('10');
      expect(badge).toHaveStyle({ backgroundColor: '#38bdf8' });
    });

    it('shows the selected arrival time and status label', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival({
            expectedAt: '2026-07-02T14:05:00.000Z',
            status: 'delayed',
          })}
          selectedRoute={route10}
        />,
      );

      expect(screen.getAllByText(/14:05/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/Delayed/)).toBeInTheDocument();
    });
  });

  describe('route summary grid', () => {
    it('renders destination, platform, scheduled, and expected info', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival({
            destination: 'Harbor Terminal',
            platform: 'B2',
            scheduledAt: '2026-07-02T14:00:00.000Z',
            expectedAt: '2026-07-02T14:05:00.000Z',
          })}
          selectedRoute={route10}
        />,
      );

      const destinations = screen.getAllByText('Harbor Terminal');
      expect(destinations.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('B2')).toBeInTheDocument();
      expect(screen.getByText(/14:00/)).toBeInTheDocument();
    });

    it('shows TBD when platform is not set', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival({
            platform: undefined,
          })}
          selectedRoute={route10}
        />,
      );

      expect(screen.getByText('TBD')).toBeInTheDocument();
    });
  });

  describe('disruption note', () => {
    it('renders the disruption note when present', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival({
            disruptionNote: 'Signal issue near Central Station',
          })}
          selectedRoute={route10}
        />,
      );

      expect(
        screen.getByText('Signal issue near Central Station'),
      ).toBeInTheDocument();
    });

    it('does not render the disruption note when absent', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival({ disruptionNote: undefined })}
          selectedRoute={route10}
        />,
      );

      expect(screen.queryByText('Service note')).not.toBeInTheDocument();
    });
  });

  describe('ordered stops', () => {
    it('renders all route stops in order', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival()}
          selectedRoute={route10}
        />,
      );

      expect(
        screen.getByRole('heading', { name: /ordered stops/i }),
      ).toBeInTheDocument();
      expect(screen.getByText('Central Station')).toBeInTheDocument();
      expect(screen.getByText('Market Street')).toBeInTheDocument();
      expect(screen.getByText('General Hospital')).toBeInTheDocument();
      // Harbor Terminal appears in both the header and stop list
      const harborTexts = screen.getAllByText('Harbor Terminal');
      expect(harborTexts.length).toBeGreaterThanOrEqual(2);
    });

    it('marks the current stop with a CSS class', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival()}
          selectedRoute={route10}
        />,
      );

      const currentStop = screen
        .getByText('Central Station')
        .closest('article');
      expect(currentStop).toHaveClass('current');

      const otherStop = screen.getByText('Market Street').closest('article');
      expect(otherStop).not.toHaveClass('current');
    });

    it('shows "Current board selection" for the selected stop', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival()}
          selectedRoute={route10}
        />,
      );

      const currentStopTexts = screen.getAllByText('Current board selection');
      expect(currentStopTexts).toHaveLength(1);
      // Should be associated with Central Station
      expect(currentStopTexts[0].closest('article')).toHaveClass('current');
    });

    it('shows "Served by this route" for other stops', () => {
      render(
        <RoutePanel
          selectedStop={centralStation}
          selectedArrival={makeArrival()}
          selectedRoute={route10}
        />,
      );

      const servedTexts = screen.getAllByText('Served by this route');
      expect(servedTexts).toHaveLength(3); // Market Street, General Hospital, Harbor Terminal
    });
  });
});

// --- ArrivalCard tests ---

describe('ArrivalCard', () => {
  const onSelect = vi.fn();

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  it('renders the line badge', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ line: '42' })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders the arrival destination', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ destination: 'City Campus' })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('City Campus')).toBeInTheDocument();
  });

  it('renders the status pill with the correct label', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ status: 'boarding' })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    const statusPill = screen.getByText('Boarding');
    expect(statusPill).toBeInTheDocument();
    expect(statusPill).toHaveClass('status-boarding');
  });

  it('renders the expected time with formatTime', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ expectedAt: '2026-07-02T14:05:00.000Z' })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText(/14:05/)).toBeInTheDocument();
  });

  it('renders the scheduled time with formatTime', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ scheduledAt: '2026-07-02T14:00:00.000Z' })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText(/14:00/)).toBeInTheDocument();
  });

  it('renders the platform info', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ platform: 'C3' })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText(/C3/)).toBeInTheDocument();
  });

  it('shows TBD when platform is not set', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ platform: undefined })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText(/TBD/)).toBeInTheDocument();
  });

  it('applies the selected class when isSelected is true', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ id: 'arr-1' })}
        isSelected={true}
        onSelect={onSelect}
      />,
    );

    const card = screen.getByRole('button', { name: /harbor terminal/i });
    expect(card).toHaveClass('selected');
  });

  it('does not apply the selected class when isSelected is false', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ id: 'arr-1' })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    const card = screen.getByRole('button', { name: /harbor terminal/i });
    expect(card).not.toHaveClass('selected');
  });

  it('calls onSelect with arrival id on click', () => {
    const handleSelect = vi.fn();

    render(
      <ArrivalCard
        arrival={makeArrival({ id: 'arr-42' })}
        isSelected={false}
        onSelect={handleSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /harbor terminal/i }));
    expect(handleSelect).toHaveBeenCalledWith('arr-42');
  });

  it('renders the disruption note when present', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({
          status: 'cancelled',
          disruptionNote: 'Cancelled due to weather',
        })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText('Cancelled due to weather')).toBeInTheDocument();
  });

  it('does not render the disruption note when absent', () => {
    render(
      <ArrivalCard
        arrival={makeArrival({ disruptionNote: undefined })}
        isSelected={false}
        onSelect={onSelect}
      />,
    );

    expect(
      screen.queryByText('Cancelled due to weather'),
    ).not.toBeInTheDocument();
  });
});
