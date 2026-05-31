import { getTransportSnapshot } from './data/mockData';
import type { ArrivalStatus } from './types';

export const snapshot = getTransportSnapshot();

export const storageKeys = {
  favoriteStops: 'public-transport-tracker.favorite-stop-ids',
  selectedStop: 'public-transport-tracker.selected-stop-id',
  activeLine: 'public-transport-tracker.active-line',
  selectedArrivals: 'public-transport-tracker.selected-arrivals',
  recentStops: 'public-transport-tracker.recent-stop-views',
} as const;

export const maxRecentStops = 5;

export const statusLabels: Record<ArrivalStatus, string> = {
  'on-time': 'On time',
  delayed: 'Delayed',
  boarding: 'Boarding',
  cancelled: 'Cancelled',
};
