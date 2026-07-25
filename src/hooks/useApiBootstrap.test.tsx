/**
 * Tests for useApiBootstrap — the on-mount effect that checks backend health
 * and loads the full transport snapshot when the server is reachable.
 *
 * The hook calls checkApiHealth (HEAD /api/health) and fetchSnapshot
 * (GET /api/snapshot) via the global fetch API. We mock fetch throughout
 * to control what the hook sees on mount.
 */
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useApiBootstrap } from './useApiBootstrap';
import type { Stop } from '../types';

// ── Sample snapshot data ───────────────────────────────────────────────

const mockSnapshot = {
  generatedAt: '2026-07-25T12:00:00.000Z',
  stops: [
    {
      id: 'stop-alpha',
      name: 'Alpha Station',
      code: '2001',
      area: 'North',
      lines: ['10', '18'],
      isFavorite: false,
    },
    {
      id: 'stop-beta',
      name: 'Beta Terminal',
      code: '2002',
      area: 'South',
      lines: ['33', '42'],
      isFavorite: true,
    },
  ],
  routes: [
    { id: 'route-10', line: '10', destination: 'Alpha Station', color: '#f00' },
    { id: 'route-18', line: '18', destination: 'Beta Terminal', color: '#0f0' },
  ],
  arrivals: [
    {
      id: 'arr-a1',
      stopId: 'stop-alpha',
      routeId: 'route-10',
      line: '10',
      destination: 'Alpha Station',
      scheduledAt: '2026-07-25T12:05:00.000Z',
      expectedAt: '2026-07-25T12:05:00.000Z',
      status: 'on-time',
      platform: 'A1',
    },
    {
      id: 'arr-b1',
      stopId: 'stop-beta',
      routeId: 'route-18',
      line: '18',
      destination: 'Beta Terminal',
      scheduledAt: '2026-07-25T12:10:00.000Z',
      expectedAt: '2026-07-25T12:15:00.000Z',
      status: 'delayed',
      platform: 'B3',
      disruptionNote: 'Signal fault',
    },
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────

const HEALTH_URL = 'http://localhost:3001/api/health';
const SNAPSHOT_URL = 'http://localhost:3001/api/snapshot';

function makeHealthOk() {
  return Promise.resolve({ ok: true, status: 200 } as Response);
}

function makeHealthFail(status: number) {
  return Promise.resolve({ ok: false, status } as Response);
}

function makeSnapshotOk(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response);
}

function makeSnapshotFail() {
  return Promise.resolve({
    ok: false,
    status: 500,
    text: () => Promise.resolve('Internal Server Error'),
  } as Response);
}

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
    Promise.reject(new TypeError('Unexpected fetch call')),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** Override the default fetch mock to respond to health + snapshot URLs. */
function mockHealthyBackend(snapshotBody = mockSnapshot) {
  vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr === HEALTH_URL) return makeHealthOk();
    if (urlStr === SNAPSHOT_URL) return makeSnapshotOk(snapshotBody);
    return Promise.reject(new Error(`Unexpected URL: ${urlStr}`));
  });
}

/** Override the default fetch mock — health passes but snapshot fails. */
function mockHealthOkSnapshotFails() {
  vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
    const urlStr = typeof url === 'string' ? url : url.toString();
    if (urlStr === HEALTH_URL) return makeHealthOk();
    if (urlStr === SNAPSHOT_URL) return makeSnapshotFail();
    return Promise.reject(new Error(`Unexpected URL: ${urlStr}`));
  });
}

describe('useApiBootstrap', () => {
  it('sets apiHealthy=true when the health check succeeds', async () => {
    mockHealthyBackend();

    const onStopsReady = vi.fn();
    const { result } = renderHook(() => useApiBootstrap(onStopsReady));

    await waitFor(() => {
      expect(result.current.apiHealthy).toBe(true);
    });

    expect(result.current.apiArrivals.size).toBe(2);
    expect(result.current.apiRoutes.size).toBe(2);

    // onStopsReady should be called with sorted stops (favorites first)
    expect(onStopsReady).toHaveBeenCalledOnce();
    const calledWithStops = onStopsReady.mock.calls[0][0] as Stop[];
    // stop-beta is a favorite, so it comes before stop-alpha
    expect(calledWithStops[0]?.id).toBe('stop-beta');
    expect(calledWithStops[1]?.id).toBe('stop-alpha');
  });

  it('arrivals are grouped and sorted by stop id in apiArrivals', async () => {
    mockHealthyBackend();

    const { result } = renderHook(() => useApiBootstrap(vi.fn()));

    await waitFor(() => {
      expect(result.current.apiHealthy).toBe(true);
    });

    const alphaArrivals = result.current.apiArrivals.get('stop-alpha');
    expect(alphaArrivals).toHaveLength(1);
    expect(alphaArrivals?.[0]?.id).toBe('arr-a1');

    const betaArrivals = result.current.apiArrivals.get('stop-beta');
    expect(betaArrivals).toHaveLength(1);
    expect(betaArrivals?.[0]?.id).toBe('arr-b1');
  });

  it('routes are keyed by id in apiRoutes', async () => {
    mockHealthyBackend();

    const { result } = renderHook(() => useApiBootstrap(vi.fn()));

    await waitFor(() => {
      expect(result.current.apiHealthy).toBe(true);
    });

    const route10 = result.current.apiRoutes.get('route-10');
    expect(route10?.line).toBe('10');
    expect(route10?.destination).toBe('Alpha Station');

    const route18 = result.current.apiRoutes.get('route-18');
    expect(route18?.line).toBe('18');
  });

  it('sets apiHealthy=false and keeps data empty when health check fails (500)', async () => {
    vi.mocked(fetch).mockImplementation((url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : url.toString();
      if (urlStr === HEALTH_URL) return makeHealthFail(500);
      return makeHealthFail(500);
    });

    const onStopsReady = vi.fn();
    const { result } = renderHook(() => useApiBootstrap(onStopsReady));

    await waitFor(() => {
      expect(result.current.apiHealthy).toBe(false);
    });

    expect(result.current.apiArrivals.size).toBe(0);
    expect(result.current.apiRoutes.size).toBe(0);
    expect(onStopsReady).not.toHaveBeenCalled();
  });

  it('sets apiHealthy=false when health check throws (network error)', async () => {
    // Keep the default mock from beforeEach which rejects all calls
    const onStopsReady = vi.fn();
    const { result } = renderHook(() => useApiBootstrap(onStopsReady));

    await waitFor(() => {
      expect(result.current.apiHealthy).toBe(false);
    });

    expect(result.current.apiArrivals.size).toBe(0);
    expect(result.current.apiRoutes.size).toBe(0);
    expect(onStopsReady).not.toHaveBeenCalled();
  });

  it('sets apiHealthy=true when healthy but snapshot fetch fails (500 on snapshot)', async () => {
    mockHealthOkSnapshotFails();

    const onStopsReady = vi.fn();
    const { result } = renderHook(() => useApiBootstrap(onStopsReady));

    await waitFor(() => {
      expect(result.current.apiHealthy).toBe(true);
    });

    // Data should be empty since snapshot failed
    expect(result.current.apiArrivals.size).toBe(0);
    expect(result.current.apiRoutes.size).toBe(0);
    // onStopsReady should NOT be called because the snapshot .then()
    // handler does not run when the response is not ok
    expect(onStopsReady).not.toHaveBeenCalled();
  });

  it('arrivals within a stop are sorted by expectedAt ascending', async () => {
    const snapshotWithMultipleArrivals = {
      ...mockSnapshot,
      arrivals: [
        {
          id: 'arr-late',
          stopId: 'stop-alpha',
          routeId: 'route-18',
          line: '18',
          destination: 'Beta Terminal',
          scheduledAt: '2026-07-25T12:10:00.000Z',
          expectedAt: '2026-07-25T12:30:00.000Z',
          status: 'delayed',
        },
        {
          id: 'arr-early',
          stopId: 'stop-alpha',
          routeId: 'route-10',
          line: '10',
          destination: 'Alpha Station',
          scheduledAt: '2026-07-25T12:05:00.000Z',
          expectedAt: '2026-07-25T12:05:00.000Z',
          status: 'on-time',
        },
      ],
    };

    mockHealthyBackend(snapshotWithMultipleArrivals);

    const { result } = renderHook(() => useApiBootstrap(vi.fn()));

    await waitFor(() => {
      expect(result.current.apiHealthy).toBe(true);
    });

    const alphaArrivals = result.current.apiArrivals.get('stop-alpha');
    expect(alphaArrivals).toHaveLength(2);
    // arr-early has expectedAt 12:05, arr-late has 12:30
    expect(alphaArrivals?.[0]?.id).toBe('arr-early');
    expect(alphaArrivals?.[1]?.id).toBe('arr-late');
  });

  it('cleans up with a cancelled flag on unmount (does not set state)', async () => {
    // Slow health fetch that never resolves
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

    const { unmount } = renderHook(() => useApiBootstrap(vi.fn()));

    // Unmount while the fetch is still pending
    unmount();

    // If the test reaches here without React warnings about
    // setState on unmounted component, the cleanup worked.
    expect(fetch).toHaveBeenCalled();
  });

  it('calls onStopsReady only once even when re-rendered with stable callback', async () => {
    mockHealthyBackend();

    const onStopsReady = vi.fn();
    const { rerender } = renderHook(
      (cb: (stops: Stop[]) => void) => useApiBootstrap(cb),
      { initialProps: onStopsReady },
    );

    await waitFor(() => {
      expect(onStopsReady).toHaveBeenCalledOnce();
    });

    // Re-render with same callback reference — the hook should
    // not fire another effect
    rerender(onStopsReady);

    // Give microtasks a chance to run
    await vi.waitFor(() => {
      expect(onStopsReady).toHaveBeenCalledOnce();
    });
  });
});
