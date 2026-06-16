import { describe, expect, it, vi, afterEach } from 'vitest';
import { formatTime, getMinutesUntil, formatRecentView } from './time';

afterEach(() => {
  vi.useRealTimers();
});

describe('time utilities', () => {
  it('formats time values using 24-hour GB locale (local TZ)', () => {
    // Intl.DateTimeFormat returns local time; the concrete value depends on runner TZ.
    // Sanity-check the shape only.
    const result = formatTime('2026-06-14T09:05:00.000Z');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('reports minutes until an arrival and handles now case', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T18:30:00.000Z'));

    expect(getMinutesUntil('2026-06-14T18:35:00.000Z')).toBe('5 min');
    expect(getMinutesUntil('2026-06-14T18:30:15.000Z')).toBe('Due now');
    expect(getMinutesUntil('2026-06-14T18:29:00.000Z')).toBe('Due now');
  });

  it('formats recent-view relative labels with graceful fallbacks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-14T18:30:00.000Z'));

    expect(formatRecentView('2026-06-14T18:29:45.000Z')).toBe(
      'Viewed just now',
    );
    expect(formatRecentView('2026-06-14T18:20:00.000Z')).toBe(
      'Viewed 10 min ago',
    );
    expect(formatRecentView('2026-06-14T16:30:00.000Z')).toBe('Viewed 2h ago');
    expect(formatRecentView('2026-06-13T18:30:00.000Z')).toBe('Viewed 13 Jun');
  });
});
