import type { Arrival, ArrivalStatus } from '../types';

export const isDisruptedStatus = (status: ArrivalStatus): boolean =>
  status === 'delayed' || status === 'cancelled';

export const isSmoothStatus = (status: ArrivalStatus): boolean =>
  status === 'on-time' || status === 'boarding';

export const isDisruptedArrival = (arrival: Arrival): boolean =>
  isDisruptedStatus(arrival.status);

export const isSmoothArrival = (arrival: Arrival): boolean =>
  isSmoothStatus(arrival.status);
