import { ArrivalsPanel } from './components/ArrivalsPanel';
import { RoutePanel } from './components/RoutePanel';
import { StopPanel } from './components/StopPanel';
import { useTransportTrackerState } from './hooks/useTransportTrackerState';
import { formatTime } from './utils';

export default function App() {
  const {
    snapshot,
    stops,
    selectedStop,
    selectedStopId,
    favoriteStops,
    recentStops,
    nearbyStops,
    activeLine,
    availableLines,
    arrivals,
    selectedArrival,
    selectedArrivalId,
    selectedRoute,
    setActiveLine,
    setSelectedArrivalId,
    handleStopSelect,
    handleFavoriteToggle,
    handleRecentHistoryClear,
    handleRecentStopDismiss,
  } = useTransportTrackerState();

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Mocked arrivals milestone</p>
          <h1>Public Transport Tracker</h1>
          <p className="page-subtitle">
            Browse saved and nearby stops, pin the places you care about most, inspect the next arrivals, and open the selected route without needing a live provider yet.
          </p>
        </div>
        <div className="summary-card">
          <span>{stops.length} stops</span>
          <span>{favoriteStops.length} pinned</span>
          <span>{snapshot.routes.length} routes</span>
          <span>{snapshot.arrivals.length} mock arrivals</span>
          <span>Updated {formatTime(snapshot.generatedAt)}</span>
        </div>
      </header>

      <main className="layout-grid">
        <StopPanel
          favoriteStops={favoriteStops}
          nearbyStops={nearbyStops}
          recentStops={recentStops}
          selectedStopId={selectedStopId}
          onStopSelect={handleStopSelect}
          onFavoriteToggle={handleFavoriteToggle}
          onRecentHistoryClear={handleRecentHistoryClear}
          onRecentStopDismiss={handleRecentStopDismiss}
        />

        <ArrivalsPanel
          selectedStop={selectedStop}
          activeLine={activeLine}
          availableLines={availableLines}
          arrivals={arrivals}
          onActiveLineChange={setActiveLine}
          onFavoriteToggle={handleFavoriteToggle}
          onArrivalSelect={setSelectedArrivalId}
          selectedArrivalId={selectedArrivalId}
        />

        <RoutePanel selectedArrival={selectedArrival} selectedRoute={selectedRoute} selectedStop={selectedStop} />
      </main>
    </div>
  );
}
