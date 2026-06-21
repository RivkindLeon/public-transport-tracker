import { getStopArrivals } from '../data/mockData';
import { maxRecentStops, snapshot, storageKeys } from '../constants';
import type {
  LineFilter,
  RecentStopFilter,
  RecentStopSort,
  RecentStopView,
  Stop,
} from '../types';

export const sortStops = (stops: Stop[]) =>
  [...stops].sort((left, right) => {
    if (left.isFavorite === right.isFavorite) {
      return left.name.localeCompare(right.name);
    }

    return left.isFavorite ? -1 : 1;
  });

const getSavedSelectedArrivals = () => {
  if (typeof window === 'undefined') {
    return {} as Record<string, string>;
  }

  const savedSelectedArrivals = window.localStorage.getItem(
    storageKeys.selectedArrivals,
  );

  if (!savedSelectedArrivals) {
    return {} as Record<string, string>;
  }

  try {
    return JSON.parse(savedSelectedArrivals) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
};

const getInitialStops = () => {
  if (typeof window === 'undefined') {
    return sortStops(snapshot.stops);
  }

  const savedFavoriteStopIds = window.localStorage.getItem(
    storageKeys.favoriteStops,
  );

  if (!savedFavoriteStopIds) {
    return sortStops(snapshot.stops);
  }

  try {
    const favoriteStopIds = new Set(
      JSON.parse(savedFavoriteStopIds) as string[],
    );

    return sortStops(
      snapshot.stops.map((stop) => ({
        ...stop,
        isFavorite: favoriteStopIds.has(stop.id),
      })),
    );
  } catch {
    return sortStops(snapshot.stops);
  }
};

const initialStops = getInitialStops();

export const getInitialSelectedStopId = () => {
  if (typeof window === 'undefined') {
    return initialStops[0]?.id ?? '';
  }

  const savedSelectedStopId = window.localStorage.getItem(
    storageKeys.selectedStop,
  );

  if (
    savedSelectedStopId &&
    initialStops.some((stop) => stop.id === savedSelectedStopId)
  ) {
    return savedSelectedStopId;
  }

  return initialStops[0]?.id ?? '';
};

export const getInitialActiveLine = (
  selectedStopId: string,
): LineFilter => {
  if (typeof window === 'undefined') {
    return 'all';
  }

  const storedLine = window.localStorage.getItem(storageKeys.activeLine) ?? 'all';
  const selectedStop = initialStops.find((stop) => stop.id === selectedStopId);

  if (
    storedLine !== 'all' &&
    selectedStop?.lines.includes(storedLine)
  ) {
    return storedLine;
  }

  return 'all';
};

export const getInitialRecentStopFilter = (): RecentStopFilter => {
  if (typeof window === 'undefined') {
    return 'all';
  }

  return window.localStorage.getItem(storageKeys.recentStopFilter) ===
    'disrupted'
    ? 'disrupted'
    : 'all';
};

export const getInitialRecentStopSort = (): RecentStopSort => {
  if (typeof window === 'undefined') {
    return 'recent';
  }

  return window.localStorage.getItem(storageKeys.recentStopSort) === 'urgent'
    ? 'urgent'
    : 'recent';
};

export const getInitialSelectedArrivalId = (
  selectedStopId: string,
  lineFilter: 'all' | string,
) => {
  const stopArrivals = getStopArrivals(selectedStopId);
  const savedSelectedArrivalId = getSavedSelectedArrivals()[selectedStopId];
  const visibleArrivals =
    lineFilter === 'all'
      ? stopArrivals
      : stopArrivals.filter((arrival) => arrival.line === lineFilter);

  if (
    savedSelectedArrivalId &&
    visibleArrivals.some((arrival) => arrival.id === savedSelectedArrivalId)
  ) {
    return savedSelectedArrivalId;
  }

  return visibleArrivals[0]?.id ?? '';
};

export const getInitialRecentStopViews = () => {
  if (typeof window === 'undefined') {
    return [] as RecentStopView[];
  }

  const savedRecentStopViews = window.localStorage.getItem(
    storageKeys.recentStops,
  );

  if (!savedRecentStopViews) {
    return [] as RecentStopView[];
  }

  try {
    const parsedRecentStopViews = JSON.parse(savedRecentStopViews);

    if (!Array.isArray(parsedRecentStopViews)) {
      return [] as RecentStopView[];
    }

    if (
      parsedRecentStopViews.every((entry: unknown) => typeof entry === 'string')
    ) {
      return (parsedRecentStopViews as string[])
        .filter((stopId) => initialStops.some((stop) => stop.id === stopId))
        .map((stopId) => ({ stopId, viewedAt: snapshot.generatedAt }));
    }

    return (parsedRecentStopViews as RecentStopView[])
      .filter(
        (entry) =>
          typeof entry?.stopId === 'string' &&
          typeof entry?.viewedAt === 'string' &&
          initialStops.some((stop) => stop.id === entry.stopId),
      )
      .slice(0, maxRecentStops);
  } catch {
    return [] as RecentStopView[];
  }
};

export { getInitialStops, getSavedSelectedArrivals, initialStops };
