// components/Map/StreamSearch/StreamSearchResults.tsx
'use client';

import React from 'react';
import StreamSearchItem from './StreamSearchItem';
import type { VisibleStream } from '@/types/models/VisibleStream';

interface StreamSearchResultsProps {
  /** Filtered streams to display */
  streams: VisibleStream[];
  /** Current search query */
  query: string;
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Stream selection handler */
  onStreamSelect: (stream: VisibleStream) => void;
  /** Refresh handler */
  onRefresh: () => void;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Custom className */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const StreamSearchResults: React.FC<StreamSearchResultsProps> = ({
  streams,
  query,
  loading,
  error,
  onStreamSelect,
  onRefresh,
  maxHeight = 400,
  className = '',
  'data-testid': testId,
}) => {
  return (
    <div
      className={`
        absolute top-full left-0 right-0 mt-1 
        bg-white/95 backdrop-blur-sm 
        border border-gray-200 rounded-lg 
        shadow-xl shadow-black/10
        z-50 ${className}
      `}
      style={{ maxHeight: `${maxHeight}px` }}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-medium text-gray-900">
            Streams in Viewport
          </h3>
          {!loading && streams.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {streams.length}
            </span>
          )}
        </div>
        
        <button
          onClick={onRefresh}
          disabled={loading}
          className="p-1 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
          title="Refresh streams"
        >
          <svg
            className={`h-4 w-4 text-gray-400 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto" style={{ maxHeight: `${maxHeight - 60}px` }}>
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm">Finding streams...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4">
            <div className="flex items-start space-x-2 text-amber-600">
              <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium">Query Warning</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No streams in viewport */}
        {!loading && !error && streams.length === 0 && !query && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <svg className="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
              />
            </svg>
            <p className="text-sm font-medium mb-1">No streams found</p>
            <p className="text-xs text-center max-w-xs">
              Move the map or zoom in to find streams in this area
            </p>
          </div>
        )}

        {/* Empty State - No results for query */}
        {!loading && !error && streams.length === 0 && query && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <svg className="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <p className="text-sm font-medium mb-1">No matching streams</p>
            <p className="text-xs text-center max-w-xs">
              No streams found matching "{query}"
            </p>
          </div>
        )}

        {/* Results List */}
        {!loading && streams.length > 0 && (
          <div className="py-1">
            {streams.map((stream) => (
              <StreamSearchItem
                key={stream.stationId}
                stream={stream}
                query={query}
                onClick={() => onStreamSelect(stream)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {!loading && streams.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/50">
          <p className="text-xs text-gray-500 text-center">
            Click a stream to fly to its location
          </p>
        </div>
      )}
    </div>
  );
};

export default StreamSearchResults;