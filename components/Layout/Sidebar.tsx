// components/Layout/Sidebar.tsx
'use client';

import React, { useState } from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import UnitsToggle, { type FlowUnit } from '@/components/settings/UnitsToggle';
import ThemeToggle, { type ThemePref } from '@/components/settings/ThemeToggle';

// Types for sidebar data (will match AppShell context later)
export interface SavedPlace {
  id: string;
  name: string;
  type?: 'home' | 'work' | 'recreation' | 'other';
  reachId?: string;
  lat?: number;
  lon?: number;
  isPrimary?: boolean;
}

interface UserPreferences {
  flowUnit: FlowUnit;
  tempUnit: 'F' | 'C';
  theme: ThemePref;
}

interface SidebarProps {
  /** Sidebar open/closed state */
  isOpen: boolean;
  /** Callback to toggle sidebar */
  onToggle: () => void;
  /** Saved places list */
  savedPlaces?: SavedPlace[];
  /** Currently active location */
  activeLocation?: SavedPlace | null;
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
  preferences = { flowUnit: 'CFS', tempUnit: 'F', theme: 'system' },
  onPreferencesChange,
  loading = false,
  error,
  className = '',
  isMobile = false,
}) => {
  const [activeSection, setActiveSection] = useState<'places' | 'settings'>('places');

  // Handle preference updates
  const updatePreference = <K extends keyof UserPreferences>(
    key: K, 
    value: UserPreferences[K]
  ) => {
    if (onPreferencesChange) {
      onPreferencesChange({ ...preferences, [key]: value });
    }
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
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              HydroDash
            </span>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Section Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { key: 'places', label: 'Places', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' },
            { key: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setActiveSection(key as 'places' | 'settings')}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium
                transition-colors relative
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
                            ${activeLocation?.id === place.id
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
                              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded capitalize">
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
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        No saved places yet
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Add locations from the map to get started
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
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Preferences
              </h3>

              {/* Flow Units */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Flow Units
                </label>
                <UnitsToggle
                  value={preferences.flowUnit}
                  onChange={(unit) => updatePreference('flowUnit', unit)}
                />
              </div>

              {/* Temperature Units */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature Units
                </label>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  {(['F', 'C'] as const).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => updatePreference('tempUnit', unit)}
                      className={`
                        px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
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

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <ThemeToggle
                  value={preferences.theme}
                  onChange={(theme) => updatePreference('theme', theme)}
                />
              </div>

              {/* Additional Settings Placeholder */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                  More settings coming soon
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;