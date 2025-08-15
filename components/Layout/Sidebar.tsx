// components/Layout/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import UnitsToggle, { type FlowUnit } from '@/components/settings/UnitsToggle';
import ThemeToggle, { type ThemePref } from '@/components/settings/ThemeToggle';
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

interface SidebarProps {
  /** Sidebar open/closed state */
  isOpen: boolean;
  /** Callback to toggle sidebar */
  onToggle: () => void;
  /** Saved places list */
  savedPlaces?: SavedPlace[];
  /** Currently active location (can be SavedPlace or RiverReach) */
  activeLocation?: ActiveLocation;
  /** Callback when location is selected */
  onLocationSelect?: (location: SavedPlace) => void;
  /** User preferences */
  preferences?: UserPreferences;
  /** Callback when preferences change */
  onPreferencesChange?: (preferences: UserPreferences) => void;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Custom className */
  className?: string;
  /** Mobile breakpoint behavior */
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  savedPlaces = [],
  activeLocation,
  onLocationSelect,
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
  loading = false,
  error,
  className = '',
  isMobile = false,
}) => {
  const [activeSection, setActiveSection] = useState<'places' | 'settings'>('places');

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

  // Check if a saved place is currently active
  const isPlaceActive = (place: SavedPlace): boolean => {
    if (!activeLocationProps) return false;
    
    // Direct ID match for saved places
    if (activeLocationProps.id === place.id) return true;
    
    // Match by reachId if both have one
    if (place.reachId && activeLocationProps.reachId === place.reachId) return true;
    
    return false;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div 
        className={`
          fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 
          border-r border-gray-200 dark:border-gray-700 shadow-lg z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            HydroDash
          </h2>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Location Info */}
        {activeLocationProps && activeLocation && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                {isRiverReach(activeLocation) ? (
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {activeLocationProps.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {activeLocationProps.reachId ? (
                    <>Reach ID: {activeLocationProps.reachId}</>
                  ) : (
                    <>Custom Location</>
                  )}
                </p>
                {isRiverReach(activeLocation) && activeLocation.streamflow && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    {activeLocation.streamflow.length} forecast types available
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'places' as const, label: 'Places', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
            { key: 'settings' as const, label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key)}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium relative
                transition-colors
                ${activeSection === key
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
              </svg>
              <span>{label}</span>
              {activeSection === key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Places Section */}
          {activeSection === 'places' && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Saved Places
              </h3>

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" variant="dots" color="primary" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-8">
                  <div className="text-red-500 mb-2">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
                </div>
              )}

              {/* Places List */}
              {!loading && !error && (
                <>
                  {savedPlaces.length > 0 ? (
                    <div className="space-y-2">
                      {savedPlaces.map((place) => (
                        <button
                          key={place.id}
                          onClick={() => onLocationSelect?.(place)}
                          className={`
                            w-full p-3 rounded-lg border-2 text-left transition-all
                            ${isPlaceActive(place)
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }
                          `}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                {place.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {place.reachId || `${place.lat}, ${place.lon}`}
                              </p>
                            </div>
                            {place.isPrimary && (
                              <div className="flex-shrink-0 ml-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              </div>
                            )}
                          </div>
                          {place.type && (
                            <div className="mt-1">
                              <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 capitalize">
                                {place.type}
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-3">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        No saved places
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Click on the map to start saving locations
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Settings Section */}
          {activeSection === 'settings' && (
            <div className="p-4 space-y-6">
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
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;