import { getStopArrivals } from './data/mockData';
import { maxRecentStops, snapshot, storageKeys } from './constants';
import type { Stop } from './types';

export type RecentStopView = {
  stopId: string;
  viewedAt: string;
};

export type RecentStopDisruptionSummary = {
  label: string;
  tone: 'calm' | 'warning';
};

export const sortStops = (stops: Stop[]) =>
  [...stops].sort((left, right) => {
    if (left.isFavorite === right.isFavorite) {
      return left.name.localeCompare(right.name);
    }

    return left.isFavorite ? -1 : 1;
  });

export const getSavedSelectedArrivals = () => {
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

export const getInitialStops = () => {
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

export const initialStops = getInitialStops();

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

export const getInitialActiveLine = (selectedStopId: string) => {
  if (typeof window === 'undefined') {
    return 'all';
  }

  const savedActiveLine = window.localStorage.getItem(storageKeys.activeLine);
  const selectedStop = initialStops.find((stop) => stop.id === selectedStopId);

  if (
    savedActiveLine &&
    savedActiveLine !== 'all' &&
    selectedStop?.lines.includes(savedActiveLine)
  ) {
    return savedActiveLine;
  }

  return 'all';
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
    const parsedRecentStopViews = JSON.parse(savedRecentStopViews) as
      | RecentStopView[]
      | string[];

    if (!Array.isArray(parsedRecentStopViews)) {
      return [] as RecentStopView[];
    }

    if (parsedRecentStopViews.every((entry) => typeof entry === 'string')) {
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

export const formatTime = (value: string) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

export const getMinutesUntil = (value: string) => {
  const deltaMs = new Date(value).getTime() - Date.now();
  const minutes = Math.max(0, Math.round(deltaMs / 60_000));

  return minutes === 0 ? 'Due now' : `${minutes} min`;
};

export const formatRecentView = (value: string) => {
  const deltaMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.round(deltaMs / 60_000));

  if (minutes < 1) {
    return 'Viewed just now';
  }

  if (minutes < 60) {
    return `Viewed ${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `Viewed ${hours}h ago`;
  }

  return `Viewed ${new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(new Date(value))}`;
};

export const getRecentStopRouteSummary = (stopId: string) => {
  const stopArrivals = getStopArrivals(stopId);
  const savedSelectedArrivalId = getSavedSelectedArrivals()[stopId];
  const highlightedArrival =
    stopArrivals.find((arrival) => arrival.id === savedSelectedArrivalId) ??
    stopArrivals[0];

  if (!highlightedArrival) {
    return 'No mock arrivals saved for this stop yet';
  }

  return `Line ${highlightedArrival.line} to ${highlightedArrival.destination} · ${getMinutesUntil(highlightedArrival.expectedAt)}`;
};

export const getRecentStopDisruptionSummary = (
  stopId: string,
): RecentStopDisruptionSummary => {
  const stopArrivals = getStopArrivals(stopId);
  const disruptedArrivals = stopArrivals.filter(
    (arrival) =>
      arrival.status === 'delayed' || arrival.status === 'cancelled',
  );

  if (disruptedArrivals.length === 0) {
    return {
      label: `${stopArrivals.length} smooth arrivals right now`,
      tone: 'calm',
    };
  }

  const cancelledCount = disruptedArrivals.filter(
    (arrival) => arrival.status === 'cancelled',
  ).length;
  const delayedCount = disruptedArrivals.length - cancelledCount;
  const disruptionBreakdown = [
    delayedCount > 0 ? `${delayedCount} delayed` : null,
    cancelledCount > 0 ? `${cancelledCount} cancelled` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    label: `${disruptedArrivals.length} disrupted arrivals · ${disruptionBreakdown}`,
    tone: 'warning',
  };
};
