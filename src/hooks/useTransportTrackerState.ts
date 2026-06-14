import { useEffect, useMemo, useState } from 'react';
import { getRoute, getStopArrivals } from '../data/mockData';
import { maxRecentStops, snapshot, storageKeys } from '../constants';
import type { RecentStopFilter, RecentStopSort, Stop } from '../types';
import {
  getInitialActiveLine,
  getInitialRecentStopFilter,
  getInitialRecentStopSort,
  getInitialRecentStopViews,
  getInitialSelectedArrivalId,
  getInitialSelectedStopId,
  getInitialStops,
  getSavedSelectedArrivals,
  sortStops,
} from '../utils/storage';
import {
  filterRecentStopViews,
  sortRecentStopViews,
} from '../utils/recentStops';

export function useTransportTrackerState() {
  const [stops, setStops] = useState<Stop[]>(() => getInitialStops());
  const [selectedStopId, setSelectedStopId] = useState(() =>
    getInitialSelectedStopId(),
  );
  const [recentStopViews, setRecentStopViews] = useState(() =>
    getInitialRecentStopViews(),
  );
  const [activeLine, setActiveLine] = useState<'all' | string>(() =>
    getInitialActiveLine(getInitialSelectedStopId()),
  );
  const [recentStopFilter, setRecentStopFilter] = useState<RecentStopFilter>(
    () => getInitialRecentStopFilter(),
  );
  const [recentStopSort, setRecentStopSort] = useState<RecentStopSort>(() =>
    getInitialRecentStopSort(),
  );
  const [boardView, setBoardView] = useState<'all' | 'disrupted' | 'smooth'>(
    'all',
  );
  const stopArrivals = useMemo(
    () => getStopArrivals(selectedStopId),
    [selectedStopId],
  );
  const [selectedArrivalId, setSelectedArrivalId] = useState(() =>
    getInitialSelectedArrivalId(
      getInitialSelectedStopId(),
      getInitialActiveLine(getInitialSelectedStopId()),
    ),
  );

  const selectedStop =
    stops.find((stop) => stop.id === selectedStopId) ?? stops[0];
  const availableLines = selectedStop?.lines ?? [];
  const lineFilteredArrivals = useMemo(
    () =>
      activeLine === 'all'
        ? stopArrivals
        : stopArrivals.filter((arrival) => arrival.line === activeLine),
    [activeLine, stopArrivals],
  );
  const arrivals = useMemo(() => {
    if (boardView === 'disrupted') {
      return lineFilteredArrivals.filter(
        (arrival) =>
          arrival.status === 'delayed' || arrival.status === 'cancelled',
      );
    }

    if (boardView === 'smooth') {
      return lineFilteredArrivals.filter(
        (arrival) =>
          arrival.status === 'on-time' || arrival.status === 'boarding',
      );
    }

    return lineFilteredArrivals;
  }, [boardView, lineFilteredArrivals]);
  const selectedArrival =
    arrivals.find((arrival) => arrival.id === selectedArrivalId) ?? arrivals[0];
  const selectedRoute = selectedArrival
    ? getRoute(selectedArrival.routeId)
    : undefined;

  const favoriteStops = stops.filter((stop) => stop.isFavorite);
  const recentStops = sortRecentStopViews(
    filterRecentStopViews(recentStopViews, recentStopFilter),
    recentStopSort,
  )
    .map((recentStopView) => {
      const stop = stops.find(
        (candidateStop) => candidateStop.id === recentStopView.stopId,
      );

      return stop ? { ...recentStopView, stop } : undefined;
    })
    .filter(
      (entry): entry is (typeof recentStopViews)[number] & { stop: Stop } =>
        Boolean(entry),
    );
  const recentStopIds = new Set(recentStopViews.map((entry) => entry.stopId));
  const nearbyStops = stops.filter(
    (stop) => !stop.isFavorite && !recentStopIds.has(stop.id),
  );

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.favoriteStops,
      JSON.stringify(
        stops.filter((stop) => stop.isFavorite).map((stop) => stop.id),
      ),
    );
  }, [stops]);

  useEffect(() => {
    window.localStorage.setItem(storageKeys.selectedStop, selectedStopId);
  }, [selectedStopId]);

  useEffect(() => {
    window.localStorage.setItem(
      storageKeys.recentStops,
      JSON.stringify(recentStopViews),
    );
  }, [recentStopViews]);

  useEffect(() => {
    window.localStorage.setItem(storageKeys.recentStopFilter, recentStopFilter);
  }, [recentStopFilter]);

  useEffect(() => {
    window.localStorage.setItem(storageKeys.recentStopSort, recentStopSort);
  }, [recentStopSort]);

  useEffect(() => {
    window.localStorage.setItem(storageKeys.activeLine, activeLine);
  }, [activeLine]);

  useEffect(() => {
    const savedSelectedArrivals = getSavedSelectedArrivals();

    if (selectedArrivalId) {
      window.localStorage.setItem(
        storageKeys.selectedArrivals,
        JSON.stringify({
          ...savedSelectedArrivals,
          [selectedStopId]: selectedArrivalId,
        }),
      );
      return;
    }

    if (!savedSelectedArrivals[selectedStopId]) {
      return;
    }

    const {
      [selectedStopId]: _removedSelectedArrival,
      ...remainingSelectedArrivals
    } = savedSelectedArrivals;
    window.localStorage.setItem(
      storageKeys.selectedArrivals,
      JSON.stringify(remainingSelectedArrivals),
    );
  }, [selectedArrivalId, selectedStopId]);

  useEffect(() => {
    if (!availableLines.includes(activeLine)) {
      setActiveLine('all');
    }
  }, [activeLine, availableLines]);

  useEffect(() => {
    if (!arrivals.some((arrival) => arrival.id === selectedArrivalId)) {
      const savedSelectedArrivalId = getSavedSelectedArrivals()[selectedStopId];
      const nextSelectedArrivalId = arrivals.some(
        (arrival) => arrival.id === savedSelectedArrivalId,
      )
        ? savedSelectedArrivalId
        : (arrivals[0]?.id ?? '');

      setSelectedArrivalId(nextSelectedArrivalId);
    }
  }, [arrivals, selectedArrivalId, selectedStopId]);

  const handleStopSelect = (stopId: string) => {
    setSelectedStopId(stopId);
    setRecentStopViews((currentRecentStopViews) =>
      [
        { stopId, viewedAt: new Date().toISOString() },
        ...currentRecentStopViews.filter((entry) => entry.stopId !== stopId),
      ].slice(0, maxRecentStops),
    );
    setActiveLine('all');
    setBoardView('all');
    setSelectedArrivalId(getInitialSelectedArrivalId(stopId, 'all'));
  };

  const handleFavoriteToggle = (stopId: string) => {
    setStops((currentStops) =>
      sortStops(
        currentStops.map((stop) =>
          stop.id === stopId ? { ...stop, isFavorite: !stop.isFavorite } : stop,
        ),
      ),
    );
  };

  return {
    snapshot,
    stops,
    selectedStop,
    selectedStopId,
    favoriteStops,
    recentStops,
    nearbyStops,
    activeLine,
    availableLines,
    recentStopFilter,
    recentStopSort,
    boardView,
    arrivals,
    lineFilteredArrivals,
    selectedArrival,
    selectedArrivalId,
    selectedRoute,
    setActiveLine,
    setRecentStopFilter,
    setRecentStopSort,
    setBoardView,
    setSelectedArrivalId,
    handleStopSelect,
    handleFavoriteToggle,
    handleRecentHistoryClear: () => setRecentStopViews([]),
    handleRecentStopDismiss: (stopId: string) =>
      setRecentStopViews((currentRecentStopViews) =>
        currentRecentStopViews.filter((entry) => entry.stopId !== stopId),
      ),
  };
}
