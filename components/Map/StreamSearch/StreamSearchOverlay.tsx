// components/Map/StreamSearch/StreamSearchOverlay.tsx
'use client';

import React, { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useStreamSearch } from '@/hooks/useStreamSearch';
import { useMapStreamHighlight } from '@/hooks/useMapStreamHighlight';
import StreamSearchInput from './StreamSearchInput';
import StreamSearchResults from './StreamSearchResults';
import type { VisibleStream } from '@/types/models/VisibleStream';

interface StreamSearchOverlayProps {
  /** Mapbox map instance */
  map: mapboxgl.Map | null;
  /** Custom className */
  className?: string;
  /** Position offset from top in pixels */
  topOffset?: number;
  /** Position offset from bottom in pixels */
  bottomOffset?: number;
  /** Position offset from left in pixels */
  leftOffset?: number;
  /** Position offset from right in pixels */
  rightOffset?: number;
  /** Show small streams in results */
  includeSmallStreams?: boolean;
  /** Maximum number of results */
  maxResults?: number;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const StreamSearchOverlay: React.FC<StreamSearchOverlayProps> = ({
  map,
  className = '',
  topOffset = 60, // Position below main search bar
  bottomOffset,
  leftOffset = 16, // Default 1rem (16px)
  rightOffset = 16, // Default 1rem (16px)
  includeSmallStreams = true,
  maxResults = 50,
  'data-testid': testId,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Stream search state management
  const {
    state,
    openSearch,
    closeSearch,
    setQuery,
    selectStream,
    refreshStreams,
    clearSearch,
  } = useStreamSearch(map, {
    includeSmallStreams,
    maxResults,
    debounceMs: 300,
    minFilterLength: 0,
  });

  // Stream highlighting functionality
  const {
    highlightStream,
    clearHighlight,
  } = useMapStreamHighlight(map, {
    autoClear: true,
    config: {
      color: '#FF4444',
      radius: 14,
      opacity: 0.8,
      strokeColor: '#FFFFFF',
      strokeWidth: 3,
      duration: 6000,
    },
  });

  // Handle stream selection
  const handleStreamSelect = async (stream: VisibleStream): Promise<void> => {
    selectStream(stream);
    await highlightStream(stream, true); // Fly to and highlight
    closeSearch();
  };

  // Handle input focus
  const handleInputFocus = (): void => {
    openSearch();
  };

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        state.isOpen
      ) {
        closeSearch();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [state.isOpen, closeSearch]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (state.isOpen) {
          closeSearch();
        } else if (state.query) {
          clearSearch();
          clearHighlight();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [state.isOpen, state.query, closeSearch, clearSearch, clearHighlight]);

  // Generate dynamic positioning styles
  const positionStyle = {
    ...(topOffset !== undefined && { top: `${topOffset}px` }),
    ...(bottomOffset !== undefined && { bottom: `${bottomOffset}px` }),
    ...(leftOffset !== undefined && { left: `${leftOffset}px` }),
    ...(rightOffset !== undefined && { right: `${rightOffset}px` }),
  };

  return (
    <div
      ref={containerRef}
      className={`absolute z-40 ${className}`}
      style={positionStyle}
      data-testid={testId}
    >
      <div className="max-w-md">
        {/* Search Input */}
        <StreamSearchInput
          value={state.query}
          onChange={setQuery}
          onFocus={handleInputFocus}
          onClear={() => {
            clearSearch();
            clearHighlight();
          }}
          loading={state.isLoading}
          placeholder="Find stream by Reach ID in this area..."
          disabled={!map}
        />

        {/* Results Dropdown */}
        {state.isOpen && (
          <StreamSearchResults
            streams={state.filteredStreams}
            query={state.query}
            loading={state.isLoading}
            error={state.error}
            onStreamSelect={handleStreamSelect}
            onRefresh={refreshStreams}
            maxHeight={400}
          />
        )}
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && state.isOpen && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-black/80 text-white text-xs rounded max-w-md">
          <div>Available: {state.availableStreams.length}</div>
          <div>Filtered: {state.filteredStreams.length}</div>
          <div>Query: "{state.query}"</div>
          <div>Loading: {state.isLoading ? 'Yes' : 'No'}</div>
          {state.error && <div className="text-red-300">Error: {state.error}</div>}
        </div>
      )}
    </div>
  );
};

export default StreamSearchOverlay;