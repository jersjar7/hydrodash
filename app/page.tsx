// app/page.tsx
'use client';

import React from 'react';
import AppShell from '@/components/Layout/AppShell';
import Map from '@/components/Map/Map';
import SearchBar from '@/components/Map/SearchBar';
import MobileNavigation from '@/components/mobile/MobileNavigation';
import { useAppContext } from '@/components/Layout/AppShell';

// Demo widget components (placeholders for future phases)
const CurrentConditionsWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Conditions</h3>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Flow Rate</span>
        <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">940 CFS</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Risk Level</span>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          High Flood
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600 dark:text-gray-400">Temperature</span>
        <span className="text-lg font-semibold text-gray-900 dark:text-white">34°F</span>
      </div>
    </div>
  </div>
);

const HydrographWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">10-Day Forecast</h3>
    <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-gray-600 dark:text-gray-400">Interactive hydrograph</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">Coming in future phases</p>
      </div>
    </div>
  </div>
);

const PrecipitationWidget = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Precipitation</h3>
    <div className="h-32 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-blue-900/20 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl mb-1">🌧️</div>
        <p className="text-gray-600 dark:text-gray-400">Precipitation map</p>
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
        <p className="font-semibold text-gray-900 dark:text-white">H: 40° L: 34°</p>
      </div>
      <div className="text-center">
        <div className="text-2xl mb-1">💨</div>
        <p className="text-sm text-gray-600 dark:text-gray-400">Wind</p>
        <p className="font-semibold text-gray-900 dark:text-white">21 mph</p>
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
  
  return (
    <div className="h-full overflow-auto p-4 space-y-6">
      {/* Location Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {activeLocation?.name || 'Provo, Utah'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {activeLocation?.reachId ? `Reach ID: ${activeLocation.reachId}` : 'High Flood Risk'}
        </p>
      </div>

      {/* Current Conditions - Hero Widget */}
      <CurrentConditionsWidget />

      {/* Widget Grid - Weather App Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2">
          <HydrographWidget />
        </div>
        <div className="space-y-4">
          <PrecipitationWidget />
          <WeatherSummaryWidget />
        </div>
      </div>

      {/* Additional Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Air Quality</h3>
          <div className="flex items-center space-x-4">
            <div className="text-3xl font-bold text-green-600">40</div>
            <div>
              <p className="text-sm text-green-600 font-medium">Good</p>
              <p className="text-xs text-gray-500">EPA AQI</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sunrise & Sunset</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Sunrise</span>
              <span className="font-semibold text-gray-900 dark:text-white">7:31 AM</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Sunset</span>
              <span className="font-semibold text-gray-900 dark:text-white">5:23 PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Tiles Button - Floating Action */}
      <div className="fixed bottom-20 right-4 md:bottom-4">
        <button className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors">
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