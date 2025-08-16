// components/Layout/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import UnitsToggle, { type FlowUnit } from '@/components/settings/UnitsToggle';
import ThemeToggle, { type ThemePref } from '@/components/settings/ThemeToggle';
import SavedPlacesList from '@/components/Sidebar/SavedPlacesList';
import { useSavedPlaces } from '@/hooks/useSavedPlaces';
import { useAppContext } from '@/components/Layout/AppShell';
import type { 
  ActiveLocation, 
  SavedPlace,
  UserPreferences
} from '@/components/Layout/AppShell';
import { 
  isRiverReach, 
  isSavedPlace, 
  getLocationProps 
} from '@/components/Layout/AppShell';

// Updated interface to match what AppShell passes
export interface SidebarProps {
  /** Sidebar open/closed state (no longer used for positioning) */
  isOpen?: boolean;
  /** Callback to toggle sidebar */
  onToggle: () => void;
  /** Saved places list (passed from AppShell but we use hook instead) */
  savedPlaces?: SavedPlace[];
  /** Currently active location (passed from AppShell but we use context instead) */
  activeLocation?: ActiveLocation;
  /** Callback when location is selected (passed from AppShell but we use context instead) */
  onLocationSelect?: (location: SavedPlace) => void;
  /** User preferences */
  preferences?: UserPreferences;
  /** Callback when preferences change */
  onPreferencesChange?: (preferences: UserPreferences) => void;
  /** Custom className */
  className?: string;
  /** Mobile breakpoint behavior */
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  onToggle,
  preferences = { 
    flowUnit: 'CFS', 
    tempUnit: 'F', 
    theme: 'system', 
    savedPlaceIds: [], 
    autoRefresh: true, 
    refreshInterval: 300000, 
    collapsedSidebar: false 
  },
  onPreferencesChange,
  className = '',
  isMobile = false,
}) => {
  // Settings panel state for the collapsible settings
  const [showSettings, setShowSettings] = useState(false);

  // Get app context for activeLocation and setActiveLocation
  const { activeLocation, setActiveLocation, currentView, setCurrentView } = useAppContext();

  // Get saved places data from hook
  const {
    places: savedPlaces,
    isLoading: savedPlacesLoading,
    error: savedPlacesError,
    getPlaceCount,
  } = useSavedPlaces();

  // Get standardized location properties for comparison
  const activeLocationProps = getLocationProps(activeLocation || null);

  // Handle preference updates
  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    if (onPreferencesChange) {
      onPreferencesChange({ ...preferences, [key]: value });
    }
  };

  // Handle saved place selection
  const handlePlaceSelect = (place: SavedPlace) => {
    // Set as active location
    setActiveLocation(place);
    
    // Switch to dashboard view to show the data
    if (currentView === 'map') {
      setCurrentView('dashboard');
    }
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      onToggle();
    }
  };

  // Handle place editing (placeholder for future implementation)
  const handlePlaceEdit = (place: SavedPlace) => {
    console.log('Edit place:', place.name);
    // TODO: Open edit modal or navigate to edit page
  };

  // Handle add new place
  const handleAddPlace = () => {
    // Switch to map view for place selection
    setCurrentView('map');
    
    // Close sidebar on mobile
    if (isMobile) {
      onToggle();
    }
  };

  // Handle map icon click
  const handleMapClick = () => {
    setCurrentView('map');
    
    // Close sidebar on mobile
    if (isMobile) {
      onToggle();
    }
  };

  // Handle settings icon click
  const handleSettingsClick = () => {
    setShowSettings(!showSettings);
  };

  // Quick action handlers
  const handleViewOnMap = (place: SavedPlace) => {
    // Set as active location
    setActiveLocation(place);
    
    // Switch to map view
    setCurrentView('map');
    
    // Close sidebar on mobile
    if (isMobile) {
      onToggle();
    }
  };

  // Check if a saved place is currently active
  const isPlaceActive = (place: SavedPlace): boolean => {
    if (!activeLocationProps) return false;
    
    // Direct ID match for saved places
    if (activeLocationProps.id === place.id) return true;
    
    // Match by reachId if both have one
    if (place.reachId && activeLocationProps.reachId === place.reachId) return true;
    
    return false;
  };

  // Get active saved place for highlighting
  const activeSavedPlace = savedPlaces.find(place => isPlaceActive(place)) || null;

  return (
    <div className={`flex flex-col h-full min-h-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Left: HydroDash Text */}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          HydroDash
        </h2>
        
        {/* Right: Map Icon + Settings Icon + Close Button */}
        <div className="flex items-center space-x-2">
          {/* Map Icon */}
          <button
            onClick={handleMapClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="View Map"
            aria-label="View map"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>

          {/* Settings Icon */}
          <button
            onClick={handleSettingsClick}
            className={`
              p-2 rounded-lg transition-colors
              ${showSettings 
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300'
              }
            `}
            title="Settings"
            aria-label="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          {/* Close Button (mobile only) */}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Optional settings panel */}
      {showSettings && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Units
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Flow</span>
                  <UnitsToggle
                    value={preferences.flowUnit as FlowUnit}
                    onChange={(value) => updatePreference('flowUnit', value)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Temperature</span>
                  <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    {(['F', 'C'] as const).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => updatePreference('tempUnit', unit)}
                        className={`
                          px-3 py-1 text-xs font-medium rounded transition-all
                          ${preferences.tempUnit === unit
                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                          }
                        `}
                      >
                        °{unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Appearance
              </h3>
              <ThemeToggle
                value={preferences.theme as ThemePref}
                onChange={(value) => updatePreference('theme', value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Content area that grows + scrolls */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="p-4 flex flex-col flex-1 min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <SavedPlacesList
              activePlace={activeSavedPlace}
              flowUnit={preferences.flowUnit}
              onPlaceSelect={handlePlaceSelect}
              onPlaceEdit={handlePlaceEdit}
              onAddPlace={handleAddPlace}
              showAddButton={false}
              showFlowData={true}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-sm flex items-center">
        <div />
        <div className="flex-1" />
        <span className="flex items-center text-green-500">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          Live data
        </span>
      </div>
    </div>
  );
};

export default Sidebar;