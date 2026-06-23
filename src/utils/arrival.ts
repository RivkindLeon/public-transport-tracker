import type { Arrival } from '../types';

export const isDisruptedArrival = (arrival: Arrival): boolean =>
  arrival.status === 'delayed' || arrival.status === 'cancelled';

export const isSmoothArrival = (arrival: Arrival): boolean =>
  arrival.status === 'on-time' || arrival.status === 'boarding';
