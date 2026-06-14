import { getStopArrivals } from '../data/mockData';
import { getMinutesUntil } from './time';
import { getSavedSelectedArrivals } from './storage';
import type {
  RecentStopDisruptionSummary,
  RecentStopFilter,
  RecentStopSort,
  RecentStopView,
} from '../types';

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
    (arrival) => arrival.status === 'delayed' || arrival.status === 'cancelled',
  );

  if (disruptedArrivals.length === 0) {
    return {
      label: `${stopArrivals.length} smooth arrivals right now`,
      tone: 'calm',
      disruptedCount: 0,
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
    disruptedCount: disruptedArrivals.length,
  };
};

const getRecentStopUrgencyMinutes = (stopId: string) => {
  const nextArrival = getStopArrivals(stopId)[0];

  if (!nextArrival) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(nextArrival.expectedAt).getTime() - Date.now();
};

export const filterRecentStopViews = (
  recentStopViews: RecentStopView[],
  filter: RecentStopFilter,
) => {
  if (filter === 'all') {
    return recentStopViews;
  }

  return recentStopViews.filter(
    (entry) => getRecentStopDisruptionSummary(entry.stopId).disruptedCount > 0,
  );
};

export const sortRecentStopViews = (
  recentStopViews: RecentStopView[],
  sort: RecentStopSort,
) => {
  return [...recentStopViews].sort((left, right) => {
    if (sort === 'urgent') {
      const disruptionDelta =
        getRecentStopDisruptionSummary(right.stopId).disruptedCount -
        getRecentStopDisruptionSummary(left.stopId).disruptedCount;

      if (disruptionDelta !== 0) {
        return disruptionDelta;
      }

      const urgencyDelta =
        getRecentStopUrgencyMinutes(left.stopId) -
        getRecentStopUrgencyMinutes(right.stopId);

      if (urgencyDelta !== 0) {
        return urgencyDelta;
      }
    }

    return (
      new Date(right.viewedAt).getTime() - new Date(left.viewedAt).getTime()
    );
  });
};
