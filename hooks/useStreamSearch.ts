// hooks/useStreamSearch.ts
/**
 * React hook for stream search functionality
 * Manages state and interactions for viewport-based stream discovery
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import { mapStreamSearchService } from '@/services/mapStreamSearchService';
import type {
  VisibleStream,
  StreamSearchState,
  StreamQueryOptions,
  StreamSearchAction,
} from '@/types/models/VisibleStream';

interface UseStreamSearchOptions extends StreamQueryOptions {
  /** Debounce delay for search input in milliseconds */
  debounceMs?: number;
  /** Auto-query on map move */
  autoQuery?: boolean;
  /** Minimum characters before filtering */
  minFilterLength?: number;
}

interface UseStreamSearchResult {
  /** Current search state */
  state: StreamSearchState;
  /** Open the search dropdown and query streams */
  openSearch: () => Promise<void>;
  /** Close the search dropdown */
  closeSearch: () => void;
  /** Set search query and filter results */
  setQuery: (query: string) => void;
  /** Select a stream from results */
  selectStream: (stream: VisibleStream) => void;
  /** Manually refresh available streams */
  refreshStreams: () => Promise<void>;
  /** Clear search and close dropdown */
  clearSearch: () => void;
}

/**
 * Hook for managing stream search state and interactions
 */
export function useStreamSearch(
  map: mapboxgl.Map | null,
  options: UseStreamSearchOptions = {}
): UseStreamSearchResult {
  const {
    debounceMs = 300,
    autoQuery = false,
    minFilterLength = 0,
    ...queryOptions
  } = options;

  const [state, setState] = useState<StreamSearchState>({
    query: '',
    availableStreams: [],
    filteredStreams: [],
    isLoading: false,
    isOpen: false,
    error: null,
    highlightedStream: null,
  });

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const mapMoveRef = useRef<NodeJS.Timeout | null>(null);
  const lastQueryRef = useRef<string>('');

  // Initialize map service
  useEffect(() => {
    if (map) {
      mapStreamSearchService.setMap(map);
    }
  }, [map]);

  // Auto-query on map move if enabled
  useEffect(() => {
    if (!map || !autoQuery) return;

    const handleMapMove = () => {
      if (mapMoveRef.current) clearTimeout(mapMoveRef.current);
      
      mapMoveRef.current = setTimeout(() => {
        if (state.isOpen) {
          queryStreams();
        }
      }, 1000);
    };

    map.on('moveend', handleMapMove);
    return () => {
      map.off('moveend', handleMapMove);
      if (mapMoveRef.current) clearTimeout(mapMoveRef.current);
    };
  }, [map, autoQuery, state.isOpen]);

  // Filter streams based on query
  const filteredStreams = useMemo(() => {
    if (!state.query || state.query.length < minFilterLength) {
      return state.availableStreams;
    }

    const query = state.query.toLowerCase().trim();
    return state.availableStreams.filter(stream => 
      stream.stationId.toLowerCase().includes(query) ||
      stream.reachId.toString().toLowerCase().includes(query) ||
      (stream.name && stream.name.toLowerCase().includes(query))
    );
  }, [state.availableStreams, state.query, minFilterLength]);

  // Update filtered streams when they change
  useEffect(() => {
    setState(prev => ({ ...prev, filteredStreams }));
  }, [filteredStreams]);

  /**
   * Query available streams in viewport
   */
  const queryStreams = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await mapStreamSearchService.getVisibleStreams(queryOptions);
      
      setState(prev => ({
        ...prev,
        availableStreams: result.streams,
        isLoading: false,
        error: result.warnings.length > 0 ? result.warnings.join('; ') : null,
      }));

      console.log(`✅ Found ${result.streams.length} streams in ${result.queryTime}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to query streams';
      console.error('❌ Stream query error:', error);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        availableStreams: [],
      }));
    }
  }, [queryOptions]);

  /**
   * Open search dropdown and query streams
   */
  const openSearch = useCallback(async (): Promise<void> => {
    setState(prev => ({ ...prev, isOpen: true }));
    
    if (state.availableStreams.length === 0) {
      await queryStreams();
    }
  }, [state.availableStreams.length, queryStreams]);

  /**
   * Close search dropdown
   */
  const closeSearch = useCallback((): void => {
    setState(prev => ({
      ...prev,
      isOpen: false,
      highlightedStream: null,
    }));
  }, []);

  /**
   * Set search query with debouncing
   */
  const setQuery = useCallback((query: string): void => {
    setState(prev => ({ ...prev, query }));

    // Clear previous debounce
    if (debounceRef.current) {
    clearTimeout(debounceRef.current);
    debounceRef.current = null;
    }

    // Don't debounce clearing or short queries
    if (!query || query.length <= 2) {
      lastQueryRef.current = query;
      return;
    }

    // Debounce longer queries
    debounceRef.current = setTimeout(() => {
      lastQueryRef.current = query;
      console.log(`🔍 Searching for: "${query}"`);
    }, debounceMs);
  }, [debounceMs]);

  /**
   * Select a stream and trigger navigation
   */
  const selectStream = useCallback((stream: VisibleStream): void => {
    setState(prev => ({
      ...prev,
      highlightedStream: stream,
      isOpen: false,
      query: stream.stationId, // Fill search with selected stream
    }));

    console.log(`✅ Selected stream: ${stream.stationId}`);
  }, []);

  /**
   * Manually refresh available streams
   */
  const refreshStreams = useCallback(async (): Promise<void> => {
    mapStreamSearchService.clearCache();
    await queryStreams();
  }, [queryStreams]);

  /**
   * Clear search and close dropdown
   */
  const clearSearch = useCallback((): void => {
    setState({
      query: '',
      availableStreams: [],
      filteredStreams: [],
      isLoading: false,
      isOpen: false,
      error: null,
      highlightedStream: null,
    });
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    lastQueryRef.current = '';
    console.log('🧹 Search cleared');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (mapMoveRef.current) clearTimeout(mapMoveRef.current);
    };
  }, []);

  return {
    state,
    openSearch,
    closeSearch,
    setQuery,
    selectStream,
    refreshStreams,
    clearSearch,
  };
}

/**
 * Simplified hook for basic stream search without advanced options
 */
export function useSimpleStreamSearch(map: mapboxgl.Map | null) {
  return useStreamSearch(map, {
    maxResults: 50,
    includeSmallStreams: true,
    debounceMs: 300,
  });
}

export default useStreamSearch;