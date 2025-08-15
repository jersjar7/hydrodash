// components/Map/SearchBar.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { appConfig } from '@/config';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Mapbox Geocoding API response types
interface MapboxFeature {
  id: string;
  type: 'Feature';
  place_type: string[];
  place_name: string;
  properties: Record<string, any>;
  text: string;
  center: [number, number]; // [lng, lat]
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  context?: Array<{
    id: string;
    text: string;
    short_code?: string;
  }>;
}

interface MapboxGeocodingResponse {
  type: 'FeatureCollection';
  query: string[];
  features: MapboxFeature[];
  attribution: string;
}

interface SearchBarProps {
  /** Mapbox map instance */
  map: mapboxgl.Map | null;
  /** Custom className */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Callback when a result is selected */
  onResultSelect?: (feature: MapboxFeature) => void;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  map,
  className = '',
  placeholder = 'Search for places or rivers...',
  onResultSelect,
  'data-testid': testId,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapboxFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { publicToken } = appConfig.public.map.mapbox;

  // Search function using Mapbox Geocoding API
  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !publicToken) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      setIsLoading(true);
      setError(null);

      // Mapbox Geocoding API
      const url = new URL('https://api.mapbox.com/geocoding/v5/mapbox.places/' + encodeURIComponent(searchQuery) + '.json');
      url.searchParams.set('access_token', publicToken);
      url.searchParams.set('limit', '5');
      url.searchParams.set('types', 'place,poi,address'); // Focus on places, points of interest, and addresses
      url.searchParams.set('autocomplete', 'true');

      const response = await fetch(url.toString(), {
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: MapboxGeocodingResponse = await response.json();
      setResults(data.features || []);
      setIsOpen(true);
      setSelectedIndex(-1);
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [publicToken]);

  // Debounced search
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      searchPlaces(searchQuery);
    }, 300);
  }, [searchPlaces]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length >= 2) {
      debouncedSearch(value);
    } else {
      setResults([]);
      setIsOpen(false);
      setError(null);
    }
  };

  // Handle result selection
  const selectResult = useCallback((feature: MapboxFeature) => {
    setQuery(feature.place_name);
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);

    // Pan map to result
    if (map && feature.center) {
      const [lng, lat] = feature.center;
      map.flyTo({
        center: [lng, lat],
        zoom: feature.place_type.includes('address') ? 16 : 
              feature.place_type.includes('poi') ? 14 : 12,
        duration: 1000,
      });

      // Add a temporary marker
      const marker = new mapboxgl.Marker({
        color: '#3b82f6',
      })
        .setLngLat([lng, lat])
        .addTo(map);

      // Remove marker after 3 seconds
      setTimeout(() => {
        marker.remove();
      }, 3000);
    }

    // Call callback if provided
    onResultSelect?.(feature);
  }, [map, onResultSelect]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          selectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search
  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    setSelectedIndex(-1);
    setError(null);
    inputRef.current?.focus();
  };

  // Get place type icon
  const getPlaceIcon = (placeTypes: string[]) => {
    if (placeTypes.includes('poi')) {
      return (
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
      );
    }
    if (placeTypes.includes('address')) {
      return (
        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
      </svg>
    );
  };

  return (
    <div className={`relative ${className}`} data-testid={testId}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <LoadingSpinner size="xs" variant="spin" color="gray" />
          ) : query ? (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              type="button"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {error ? (
            <div className="p-3 text-center text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : results.length > 0 ? (
            results.map((feature, index) => (
              <button
                key={feature.id}
                onClick={() => selectResult(feature)}
                className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 focus:bg-gray-50 dark:focus:bg-gray-700 focus:outline-none ${
                  index === selectedIndex ? 'bg-gray-50 dark:bg-gray-700' : ''
                } ${index === 0 ? 'rounded-t-lg' : ''} ${
                  index === results.length - 1 ? 'rounded-b-lg' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getPlaceIcon(feature.place_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {feature.text}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {feature.place_name}
                    </p>
                  </div>
                </div>
              </button>
            ))
          ) : query.trim().length >= 2 && !isLoading ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
              No results found
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;