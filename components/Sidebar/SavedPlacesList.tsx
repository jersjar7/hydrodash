// components/Sidebar/SavedPlacesList.tsx
'use client';

import React from 'react';
import { SavedPlace } from '@/types/models/SavedPlace';
import { FlowUnit } from '@/types/models/UserPreferences';
import { RiskLevel } from '@/types/models/FlowForecast';
import { WeatherData } from '@/components/display/WeatherSummary';
import LocationCard from './LocationCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Data structure for flow information per location
interface LocationFlowData {
  [placeId: string]: {
    flow: number;
    riskLevel: RiskLevel;
    loading?: boolean;
    error?: string;
  };
}

// Data structure for weather information per location
interface LocationWeatherData {
  [placeId: string]: {
    weather?: WeatherData;
    loading?: boolean;
    error?: string;
  };
}

interface SavedPlacesListProps {
  /** Array of saved places to display */
  places: SavedPlace[];
  /** Currently active/selected place */
  activePlace?: SavedPlace | null;
  /** Flow data for each location (keyed by place ID) */
  flowData?: LocationFlowData;
  /** Weather data for each location (keyed by place ID) */
  weatherData?: LocationWeatherData;
  /** Flow unit preference */
  flowUnit?: FlowUnit;
  /** Loading state for the entire list */
  loading?: boolean;
  /** Error state for the list */
  error?: string;
  /** Callback when a place is selected */
  onPlaceSelect?: (place: SavedPlace) => void;
  /** Callback when edit is requested */
  onPlaceEdit?: (place: SavedPlace) => void;
  /** Callback when delete is requested */
  onPlaceDelete?: (place: SavedPlace) => void;
  /** Callback when add new place is requested */
  onAddPlace?: () => void;
  /** Custom className */
  className?: string;
  /** Show add button */
  showAddButton?: boolean;
}

const SavedPlacesList: React.FC<SavedPlacesListProps> = ({
  places,
  activePlace,
  flowData = {},
  weatherData = {},
  flowUnit = 'CFS',
  loading = false,
  error,
  onPlaceSelect,
  onPlaceEdit,
  onPlaceDelete,
  onAddPlace,
  className = '',
  showAddButton = true,
}) => {
  // Loading state
  if (loading) {
    return (
      <div className={`flex justify-center py-8 ${className}`}>
        <LoadingSpinner size="md" variant="dots" color="primary" text="Loading places..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-500 mb-2">
          <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {error}
        </p>
        {onAddPlace && (
          <button
            onClick={onAddPlace}
            className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            Try adding a place
          </button>
        )}
      </div>
    );
  }

  // Empty state
  if (places.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
          No saved places
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Add locations from the map to monitor flow and weather conditions
        </p>
        {showAddButton && onAddPlace && (
          <button
            onClick={onAddPlace}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add your first place
          </button>
        )}
      </div>
    );
  }

  // Sort places: primary first, then by name
  const sortedPlaces = [...places].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Add Place Button */}
      {showAddButton && onAddPlace && (
        <button
          onClick={onAddPlace}
          className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 group"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium">Add new place</span>
          </div>
        </button>
      )}

      {/* Places List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedPlaces.map((place) => (
          <LocationCard
            key={place.id}
            place={place}
            isActive={activePlace?.id === place.id}
            flowData={flowData[place.id]}
            weatherData={weatherData[place.id]}
            flowUnit={flowUnit}
            onSelect={onPlaceSelect}
            onEdit={onPlaceEdit}
            onDelete={onPlaceDelete}
          />
        ))}
      </div>

      {/* Summary Footer */}
      {places.length > 0 && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {places.length} {places.length === 1 ? 'place' : 'places'} saved
            </span>
            {places.some(p => p.isPrimary) && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span>Primary</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedPlacesList;