import { describe, expect, it } from 'vitest';
import type { Arrival } from '../types';
import { isDisruptedArrival, isSmoothArrival } from './arrival';

const base: Arrival = {
  id: 'test-arrival',
  stopId: 'stop-test',
  routeId: 'route-test',
  line: '10',
  destination: 'Test',
  scheduledAt: '2026-06-21T17:00:00.000Z',
  expectedAt: '2026-06-21T17:05:00.000Z',
  status: 'on-time',
};

describe('isDisruptedArrival', () => {
  it('returns true for delayed arrivals', () => {
    expect(isDisruptedArrival({ ...base, status: 'delayed' })).toBe(true);
  });

  it('returns true for cancelled arrivals', () => {
    expect(isDisruptedArrival({ ...base, status: 'cancelled' })).toBe(true);
  });

  it('returns false for on-time arrivals', () => {
    expect(isDisruptedArrival({ ...base, status: 'on-time' })).toBe(false);
  });

  it('returns false for boarding arrivals', () => {
    expect(isDisruptedArrival({ ...base, status: 'boarding' })).toBe(false);
  });
});

describe('isSmoothArrival', () => {
  it('returns true for on-time arrivals', () => {
    expect(isSmoothArrival({ ...base, status: 'on-time' })).toBe(true);
  });

  it('returns true for boarding arrivals', () => {
    expect(isSmoothArrival({ ...base, status: 'boarding' })).toBe(true);
  });

  it('returns false for delayed arrivals', () => {
    expect(isSmoothArrival({ ...base, status: 'delayed' })).toBe(false);
  });

  it('returns false for cancelled arrivals', () => {
    expect(isSmoothArrival({ ...base, status: 'cancelled' })).toBe(false);
  });
});
