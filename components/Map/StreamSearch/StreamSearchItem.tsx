// components/Map/StreamSearch/StreamSearchItem.tsx
'use client';

import React from 'react';
import type { VisibleStream } from '@/types/models/VisibleStream';

interface StreamSearchItemProps {
  /** Stream to display */
  stream: VisibleStream;
  /** Current search query for highlighting */
  query: string;
  /** Click handler */
  onClick: () => void;
  /** Custom className */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const StreamSearchItem: React.FC<StreamSearchItemProps> = ({
  stream,
  query,
  onClick,
  className = '',
  'data-testid': testId,
}) => {
  // Highlight matching text
  const highlightText = (text: string, highlight: string): React.ReactNode => {
    if (!highlight.trim()) return text;

    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Get stream order category styling
  const getStreamOrderStyle = (order: number) => {
    if (order <= 2) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (order <= 4) return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-purple-100 text-purple-700 border-purple-200';
  };

  // Get stream order label
  const getStreamOrderLabel = (order: number) => {
    if (order <= 2) return 'Small';
    if (order <= 4) return 'Medium';
    return 'Large';
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full px-4 py-3 text-left 
        hover:bg-blue-50 focus:bg-blue-50 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
        transition-colors duration-150
        border-b border-gray-100 last:border-b-0
        ${className}
      `}
      data-testid={testId}
    >
      <div className="flex items-center justify-between">
        {/* Stream Info */}
        <div className="flex-1 min-w-0">
          {/* Station ID */}
          <div className="text-sm font-medium text-gray-900 truncate">
            {highlightText(stream.stationId, query)}
          </div>

          {/* Reach ID (if different) */}
          {String(stream.reachId) !== stream.stationId && (
            <div className="text-xs text-gray-500 truncate">
              Reach: {highlightText(String(stream.reachId), query)}
            </div>
          )}

          {/* Stream Name (if available) */}
          {stream.name && (
            <div className="text-xs text-gray-600 truncate mt-1">
              {highlightText(stream.name, query)}
            </div>
          )}

          {/* Coordinates */}
          <div className="text-xs text-gray-400 mt-1">
            {stream.latitude.toFixed(4)}, {stream.longitude.toFixed(4)}
          </div>
        </div>

        {/* Stream Order Badge */}
        <div className="ml-3 flex-shrink-0">
          <span
            className={`
              inline-flex items-center px-2 py-1 
              rounded-full text-xs font-medium border
              ${getStreamOrderStyle(stream.streamOrder)}
            `}
          >
            {getStreamOrderLabel(stream.streamOrder)} {stream.streamOrder}
          </span>
        </div>
      </div>

      {/* Navigation Arrow */}
      <div className="flex items-center justify-end mt-2">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span className="text-xs text-gray-500 ml-1">Click to navigate</span>
      </div>
    </button>
  );
};

export default StreamSearchItem;