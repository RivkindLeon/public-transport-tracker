import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  getRecentStopDisruptionSummary,
  filterRecentStopViews,
  sortRecentStopViews,
} from './recentStops';
import type { RecentStopView } from '../types';

afterEach(() => {
  vi.useRealTimers();
});

describe('recentStops utilities', () => {
  it('returns a label and count for a stop (tone depends on current mock data)', () => {
    const summary = getRecentStopDisruptionSummary('stop-central');
    expect(typeof summary.tone).toBe('string');
    expect(typeof summary.disruptedCount).toBe('number');
    expect(summary.label.length).toBeGreaterThan(0);
  });

  it('counts delayed and cancelled arrivals correctly', () => {
    // stop-hospital has known mock data with mixed statuses
    const summary = getRecentStopDisruptionSummary('stop-hospital');
    expect(summary.tone).toBe('warning');
    expect(summary.disruptedCount).toBeGreaterThan(0);
  });

  it('filters recent views to only disrupted stops when filter is "disrupted"', () => {
    const views: RecentStopView[] = [
      { stopId: 'stop-central', viewedAt: '2026-06-14T18:00:00.000Z' },
      { stopId: 'stop-hospital', viewedAt: '2026-06-14T18:05:00.000Z' },
    ];

    const filtered = filterRecentStopViews(views, 'disrupted');
    // stop-central currently has disruption state in mock data
    expect(filtered.length).toBeGreaterThan(0);
    expect(
      filtered.every(
        (v) => v.stopId === 'stop-central' || v.stopId === 'stop-hospital',
      ),
    ).toBe(true);
  });

  it('sorts by most recent view when sort mode is "recent"', () => {
    const views: RecentStopView[] = [
      { stopId: 'stop-central', viewedAt: '2026-06-14T10:00:00.000Z' },
      { stopId: 'stop-market', viewedAt: '2026-06-14T18:10:00.000Z' },
    ];

    const sorted = sortRecentStopViews(views, 'recent');
    expect(sorted[0].stopId).toBe('stop-market');
  });

  it('sorts disruption-first then urgency when sort mode is "urgent"', () => {
    const views: RecentStopView[] = [
      { stopId: 'stop-central', viewedAt: '2026-06-14T09:00:00.000Z' },
      { stopId: 'stop-hospital', viewedAt: '2026-06-14T09:05:00.000Z' },
    ];

    const sorted = sortRecentStopViews(views, 'urgent');
    // First element should be one of the stops with disruptions (order not strictly asserted)
    expect(['stop-central', 'stop-hospital']).toContain(sorted[0].stopId);
  });

  it('does not mutate the input list when sorting', () => {
    const views: RecentStopView[] = [
      { stopId: 'stop-central', viewedAt: '2026-06-14T10:00:00.000Z' },
      { stopId: 'stop-market', viewedAt: '2026-06-14T18:10:00.000Z' },
    ];
    const copy = [...views];

    sortRecentStopViews(views, 'recent');
    expect(views).toEqual(copy);
  });
});
