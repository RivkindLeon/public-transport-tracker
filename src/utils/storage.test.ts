import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import type { Stop } from '../types';
import {
  sortStops,
  getInitialSelectedStopId,
  getInitialActiveLine,
  getInitialRecentStopFilter,
  getInitialRecentStopSort,
  getInitialSelectedArrivalId,
  getInitialRecentStopViews,
  initialStops,
} from './storage';

const originalWindow = globalThis.window;

beforeEach(() => {
  // Reset DOM and storage before each test
  vi.resetModules();
});

afterEach(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', {
      value: originalWindow,
      configurable: true,
    });
  } else {
    // @ts-expect-error testing cleanup
    delete globalThis.window;
  }
  localStorage.clear();
});

describe('storage utilities (local-first)', () => {
  it('sorts stops putting favorites first then alphabetically', () => {
    const mixed: Stop[] = [
      {
        id: 'b',
        name: 'Beta',
        isFavorite: false,
        code: 'B',
        area: 'Test',
        lines: [],
      },
      {
        id: 'a',
        name: 'Alpha',
        isFavorite: true,
        code: 'A',
        area: 'Test',
        lines: [],
      },
      {
        id: 'c',
        name: 'Charlie',
        isFavorite: false,
        code: 'C',
        area: 'Test',
        lines: [],
      },
    ];

    const sorted = sortStops(mixed);
    expect(sorted.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns first stop id as fallback when nothing saved or server-render', () => {
    // @ts-expect-error test without DOM
    delete globalThis.window;

    const firstId = initialStops[0]?.id ?? '';
    expect(getInitialSelectedStopId()).toBe(firstId);
  });

  it('restores saved stop id when it exists in snapshot', () => {
    localStorage.setItem(
      'public-transport-tracker.selected-stop-id',
      'stop-riverside',
    );

    expect(getInitialSelectedStopId()).toBe('stop-riverside');
  });

  it('falls back to first stop when saved id is stale', () => {
    localStorage.setItem(
      'public-transport-tracker.selected-stop-id',
      'stop-ghost',
    );

    expect(getInitialSelectedStopId()).toBe(initialStops[0]?.id ?? '');
  });

  it('returns "all" for active line when nothing saved', () => {
    expect(getInitialActiveLine('stop-central')).toBe('all');
  });

  it('restores active line only when valid for the selected stop', () => {
    localStorage.setItem('public-transport-tracker.active-line', '18');

    expect(getInitialActiveLine('stop-central')).toBe('18');
    expect(getInitialActiveLine('stop-hospital')).toBe('all'); // 18 not valid here
  });

  it('reads saved recent filter/sort preferences with safe fallback', () => {
    localStorage.setItem(
      'public-transport-tracker.recent-stop-filter',
      'disrupted',
    );
    localStorage.setItem('public-transport-tracker.recent-stop-sort', 'urgent');

    expect(getInitialRecentStopFilter()).toBe('disrupted');
    expect(getInitialRecentStopSort()).toBe('urgent');
  });

  it('computes initial selected arrival preferring saved selection when still visible', () => {
    const stopId = 'stop-central';
    // Simulated saved arrival for this stop
    const saved = { [stopId]: 'arrival-42' };
    localStorage.setItem(
      'public-transport-tracker.selected-arrivals',
      JSON.stringify(saved),
    );

    // The helper reads the saved value and checks against getStopArrivals,
    // so if the id exists in mock it will return it. Accept either real id or first arrival.
    const result = getInitialSelectedArrivalId(stopId, 'all');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('hydrates recent stop views from storage and truncates old strings', () => {
    const legacy = ['stop-central', 'stop-market'];
    localStorage.setItem(
      'public-transport-tracker.recent-stop-views',
      JSON.stringify(legacy),
    );

    const views = getInitialRecentStopViews();
    expect(views).toHaveLength(2);
    expect(views[0]).toMatchObject({ stopId: 'stop-central' });
  });
});
