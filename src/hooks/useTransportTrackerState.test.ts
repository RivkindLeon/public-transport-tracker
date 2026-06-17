import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTransportTrackerState } from './useTransportTrackerState';
import { storageKeys } from '../constants';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
});

describe('useTransportTrackerState', () => {
  it('initializes with the first stop as selected', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    expect(result.current.selectedStopId).toBe('stop-central');
    expect(result.current.selectedStop?.name).toBe('Central Station');
  });

  it('initializes with "all" active line and board view', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    expect(result.current.activeLine).toBe('all');
    expect(result.current.boardView).toBe('all');
  });

  it('initializes with arrivals for the first stop', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    expect(result.current.arrivals.length).toBeGreaterThan(0);
    expect(
      result.current.arrivals.every((a) => a.stopId === 'stop-central'),
    ).toBe(true);
  });

  it('initializes with a selected arrival from the computed filtered arrivals', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    expect(result.current.selectedArrival).toBeDefined();
    expect(result.current.selectedArrivalId).toBe(
      result.current.arrivals[0]?.id ?? '',
    );
  });

  it('restores a saved selected stop from localStorage', () => {
    localStorage.setItem(storageKeys.selectedStop, 'stop-riverside');

    const { result } = renderHook(() => useTransportTrackerState());

    expect(result.current.selectedStopId).toBe('stop-riverside');
    expect(result.current.selectedStop?.name).toBe('Riverside Park');
  });

  it('falls back to first stop when saved stop id is stale', () => {
    localStorage.setItem(storageKeys.selectedStop, 'stop-nonexistent');

    const { result } = renderHook(() => useTransportTrackerState());

    // Hook reads initial stop id from storage, but selectedStop is
    // computed as the hit from the stops array, falling back to stops[0]
    expect(result.current.selectedStop?.id).toBe('stop-central');
  });

  it('handleStopSelect changes the selected stop and resets filters', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.handleStopSelect('stop-hospital');
    });

    expect(result.current.selectedStopId).toBe('stop-hospital');
    expect(result.current.selectedStop?.name).toBe('General Hospital');
    expect(result.current.activeLine).toBe('all');
    expect(result.current.boardView).toBe('all');
    // Arrivals should now be for the new stop
    expect(
      result.current.arrivals.every((a) => a.stopId === 'stop-hospital'),
    ).toBe(true);
  });

  it('handleStopSelect stores the selection in localStorage', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.handleStopSelect('stop-market');
    });

    expect(localStorage.getItem(storageKeys.selectedStop)).toBe('stop-market');
    expect(localStorage.getItem(storageKeys.activeLine)).toBe('all');
  });

  it('handleStopSelect adds the stop to recent views', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.handleStopSelect('stop-hospital');
    });

    expect(
      result.current.recentStops.some((rs) => rs.stopId === 'stop-hospital'),
    ).toBe(true);
    // The initial stop (stop-central) is not pre-loaded — only added after explicit selection
    expect(
      result.current.recentStops.some((rs) => rs.stopId === 'stop-central'),
    ).toBe(false);
  });

  it('handleFavoriteToggle toggles a stop between favorite and non-favorite', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    // stop-campus starts as not favorite
    expect(
      result.current.stops.find((s) => s.id === 'stop-campus')?.isFavorite,
    ).toBe(false);

    act(() => {
      result.current.handleFavoriteToggle('stop-campus');
    });

    expect(
      result.current.stops.find((s) => s.id === 'stop-campus')?.isFavorite,
    ).toBe(true);

    act(() => {
      result.current.handleFavoriteToggle('stop-campus');
    });

    expect(
      result.current.stops.find((s) => s.id === 'stop-campus')?.isFavorite,
    ).toBe(false);
  });

  it('handleFavoriteToggle persists favorites to localStorage', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.handleFavoriteToggle('stop-riverside');
    });

    const saved = JSON.parse(
      localStorage.getItem(storageKeys.favoriteStops) ?? '[]',
    );
    expect(saved).toContain('stop-riverside');
  });

  it('filters arrivals by active line', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.setActiveLine('10');
    });

    expect(result.current.activeLine).toBe('10');
    expect(result.current.arrivals.every((a) => a.line === '10')).toBe(true);
  });

  it('boardView "disrupted" shows only delayed/cancelled arrivals', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.setBoardView('disrupted');
    });

    expect(result.current.boardView).toBe('disrupted');
    expect(result.current.arrivals.length).toBeGreaterThanOrEqual(0);
    expect(
      result.current.arrivals.every(
        (a) => a.status === 'delayed' || a.status === 'cancelled',
      ),
    ).toBe(true);
  });

  it('boardView "smooth" shows only on-time/boarding arrivals', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.setBoardView('smooth');
    });

    expect(result.current.boardView).toBe('smooth');
    expect(
      result.current.arrivals.every(
        (a) => a.status === 'on-time' || a.status === 'boarding',
      ),
    ).toBe(true);
  });

  it('boardView "all" returns all line-filtered arrivals', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.setBoardView('smooth');
    });

    expect(result.current.boardView).toBe('smooth');

    act(() => {
      result.current.setBoardView('all');
    });

    expect(result.current.boardView).toBe('all');
    expect(result.current.arrivals.length).toBe(
      result.current.lineFilteredArrivals.length,
    );
  });

  it('selects an arrival from the filtered list', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    const arrivals = result.current.arrivals;
    expect(arrivals.length).toBeGreaterThanOrEqual(2);

    const secondArrivalId = arrivals[1]?.id;
    expect(secondArrivalId).toBeDefined();

    act(() => {
      result.current.setSelectedArrivalId(secondArrivalId);
    });

    expect(result.current.selectedArrivalId).toBe(secondArrivalId);
    expect(result.current.selectedArrival?.id).toBe(secondArrivalId);
  });

  it('falls back to first arrival when selected arrival is not in the filtered set', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      // Switch to a stop that has arrivals
      result.current.handleStopSelect('stop-hospital');
    });

    const hospitalArrivalIds = result.current.arrivals.map((a) => a.id);
    expect(hospitalArrivalIds.length).toBeGreaterThan(0);

    // Manually set an arrival that exists at this stop
    act(() => {
      result.current.setSelectedArrivalId(hospitalArrivalIds[0]!);
    });

    expect(result.current.selectedArrivalId).toBe(hospitalArrivalIds[0]);

    // Now switch to a filtered line that excludes that arrival
    act(() => {
      result.current.setActiveLine('33');
    });

    // The selected arrival should fall back to the first available in the filtered set
    expect(result.current.arrivals.every((a) => a.line === '33')).toBe(true);
    expect(result.current.selectedArrivalId).toBe(
      result.current.arrivals[0]?.id ?? '',
    );
  });

  it('availableLines reflect the currently selected stop', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    // stop-riverside has lines ['18', '33']
    act(() => {
      result.current.handleStopSelect('stop-riverside');
    });

    expect(result.current.availableLines).toEqual(['18', '33']);
  });

  it('persists active line to localStorage', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.setActiveLine('18');
    });

    expect(localStorage.getItem(storageKeys.activeLine)).toBe('18');
  });

  it('selectedRoute is defined when a valid arrival is selected', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    expect(result.current.selectedRoute).toBeDefined();
    expect(result.current.selectedRoute?.id).toBe(
      result.current.selectedArrival?.routeId,
    );
  });

  it('handleRecentHistoryClear empties the recent stop views', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.handleRecentHistoryClear();
    });

    expect(result.current.recentStops.length).toBe(0);
  });

  it('handleRecentStopDismiss removes a specific stop from recent views', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    // Visit a stop first
    act(() => {
      result.current.handleStopSelect('stop-market');
    });

    const beforeDismiss = result.current.recentStops.length;
    expect(beforeDismiss).toBeGreaterThan(0);

    const stopToDismiss = result.current.recentStops[0]?.stopId;
    expect(stopToDismiss).toBeDefined();

    act(() => {
      result.current.handleRecentStopDismiss(stopToDismiss!);
    });

    expect(
      result.current.recentStops.some((rs) => rs.stopId === stopToDismiss),
    ).toBe(false);
    expect(result.current.recentStops.length).toBe(beforeDismiss - 1);
  });

  it('groups stops into favorites, recent, and nearby correctly', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    // stop-central and stop-market start as favorites
    expect(result.current.favoriteStops.length).toBeGreaterThanOrEqual(2);
    expect(result.current.favoriteStops.every((s) => s.isFavorite)).toBe(true);

    // Nearby should exclude favorites and recent views
    const allFavoriteAndRecent = new Set([
      ...result.current.favoriteStops.map((s) => s.id),
      ...result.current.recentStops.map((rs) => rs.stopId),
    ]);
    expect(
      result.current.nearbyStops.every((s) => !allFavoriteAndRecent.has(s.id)),
    ).toBe(true);
  });

  it('recent stop filter and sort state can be updated', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    expect(result.current.recentStopFilter).toBe('all');

    act(() => {
      result.current.setRecentStopFilter('disrupted');
    });

    expect(result.current.recentStopFilter).toBe('disrupted');

    act(() => {
      result.current.setRecentStopSort('urgent');
    });

    expect(result.current.recentStopSort).toBe('urgent');
  });

  it('persists recent stop filter and sort to localStorage', () => {
    const { result } = renderHook(() => useTransportTrackerState());

    act(() => {
      result.current.setRecentStopFilter('disrupted');
    });
    act(() => {
      result.current.setRecentStopSort('urgent');
    });

    expect(localStorage.getItem(storageKeys.recentStopFilter)).toBe(
      'disrupted',
    );
    expect(localStorage.getItem(storageKeys.recentStopSort)).toBe('urgent');
  });
});
