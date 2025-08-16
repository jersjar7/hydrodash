// app/page.tsx
'use client';

import React from 'react';
import AppShell from '@/components/Layout/AppShell';
import Map from '@/components/Map/Map';
import SearchBar from '@/components/Map/SearchBar';
import MobileNavigation from '@/components/mobile/MobileNavigation';
import { useAppContext, isRiverReach, getLocationProps } from '@/components/Layout/AppShell';

// Import real widget components
import CurrentConditionsWidget from '@/components/widgets/CurrentConditionsWidget';
import HydrographWidget from '@/components/widgets/HydrographWidget';
import FlowSummaryWidget from '@/components/widgets/FlowSummaryWidget';

// Placeholder widgets for features not yet implemented
const PrecipitationWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Precipitation</h3>
    <div className="h-32 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-1">🌧️</div>
        <p className="text-gray-600 dark:text-gray-400">Precipitation map</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">Coming soon</p>
      </div>
    </div>
  </div>
);

const WeatherSummaryWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Weather Summary</h3>
    <div className="grid grid-cols-2 gap-4">
      <div className="text-center">
        <div className="text-2xl mb-1">🌧️</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Rain</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">Coming soon</p>
      </div>
      <div className="text-center">
        <div className="text-2xl mb-1">💨</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Wind</p>
        <p className="text-xs text-gray-500 dark:text-gray-500">Coming soon</p>
      </div>
    </div>
  </div>
);

const AirQualityWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Air Quality</h3>
    <div className="h-24 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl mb-1">🌬️</div>
        <p className="text-xs text-gray-500 dark:text-gray-500">Coming soon</p>
      </div>
    </div>
  </div>
);

const SunriseSunsetWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sunrise & Sunset</h3>
    <div className="h-24 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/20 dark:to-yellow-900/20 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl mb-1">🌅</div>
        <p className="text-xs text-gray-500 dark:text-gray-500">Coming soon</p>
      </div>
    </div>
  </div>
);

// Component for when no stream is selected
const NoStreamSelected = () => (
  <div className="h-full flex items-center justify-center p-8">
    <div className="text-center max-w-md">
      <div className="w-24 h-24 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
        <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
        Select a Stream
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Choose a river or stream on the map to view current flow conditions, forecasts, and detailed hydrological data.
      </p>
      <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
        <p>• Current flow conditions</p>
        <p>• 10-day flow forecasts</p>
        <p>• Risk level assessments</p>
        <p>• Historical comparisons</p>
      </div>
    </div>
  </div>
);

// Map screen content
const MapScreen = () => {
  const [map, setMap] = React.useState<mapboxgl.Map | null>(null);
  
  return (
    <div className="h-full relative">
      {/* Search Bar overlay */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <SearchBar 
          map={map}
          placeholder="Search for rivers or places..."
          className="max-w-md"
        />
      </div>
      
      {/* Map */}
      <Map onReady={setMap} onPickReach={(reachId) => console.log('Selected reach:', reachId)} />
    </div>
  );
};

// Dashboard screen content  
const DashboardScreen = () => {
  const { activeLocation } = useAppContext();
  
  // Check if we have a selected river reach
  const hasActiveReach = isRiverReach(activeLocation) || getLocationProps(activeLocation)?.reachId;
  
  // If no reach is selected, show the "Select a stream" message
  if (!hasActiveReach) {
    return (
      <div className="h-full overflow-auto">
        <NoStreamSelected />
      </div>
    );
  }

  // Get location properties for display
  const locationProps = getLocationProps(activeLocation);
  const displayName = locationProps?.name || activeLocation?.name || 'Unknown Location';
  const reachId = isRiverReach(activeLocation) ? activeLocation.reachId : locationProps?.reachId;
  
  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* Location Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {displayName}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {reachId ? (
            <>
              Reach ID: <span className="font-mono text-sm">{reachId}</span>
            </>
          ) : (
            'River Flow Monitoring'
          )}
        </p>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Real-time data • Auto-refreshing
        </div>
      </div>

      {/* Current Conditions - Hero Widget */}
      <CurrentConditionsWidget className="shadow-lg" />

      {/* Primary Widget Grid - Flow Focus */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Hydrograph - Takes up more space */}
        <div className="md:col-span-2">
          <HydrographWidget height={400} />
        </div>
        
        {/* Flow Summary in sidebar */}
        <div className="space-y-4">
          <FlowSummaryWidget />
          {/* Future: Add more compact widgets here */}
        </div>
      </div>

      {/* Secondary Widget Grid - Environmental Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <PrecipitationWidget />
        <WeatherSummaryWidget />
        <AirQualityWidget />
        <SunriseSunsetWidget />
      </div>

      {/* Footer Info */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400 pb-4">
        <p>Data provided by NOAA National Water Model</p>
        <p>Updates every 6 hours • Last model run: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Add Tiles Button - Floating Action */}
      <div className="fixed bottom-20 right-4 md:bottom-4">
        <button 
          className="w-14 h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
          title="Add more widgets (coming soon)"
          disabled
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Main content component that switches between views
const AppContent = () => {
  const { currentView } = useAppContext();
  
  return currentView === 'map' ? <MapScreen /> : <DashboardScreen />;
};

// Root page component
export default function Page() {
  return (
    <AppShell>
      <AppContent />
      <MobileNavigation />
    </AppShell>
  );
}