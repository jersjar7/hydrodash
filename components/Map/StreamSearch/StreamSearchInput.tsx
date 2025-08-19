// components/Map/StreamSearch/StreamSearchInput.tsx
'use client';

import React from 'react';

interface StreamSearchInputProps {
  /** Input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Focus handler */
  onFocus: () => void;
  /** Clear handler */
  onClear: () => void;
  /** Loading state */
  loading: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom className */
  className?: string;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

const StreamSearchInput: React.FC<StreamSearchInputProps> = ({
  value,
  onChange,
  onFocus,
  onClear,
  loading,
  placeholder = 'Find stream by Reach ID...',
  disabled = false,
  className = '',
  'data-testid': testId,
}) => {
  return (
    <div className={`relative ${className}`} data-testid={testId}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full pl-10 pr-12 py-3 
            border border-gray-300 rounded-lg
            bg-white/95 backdrop-blur-sm
            text-sm text-gray-900 placeholder-gray-500
            shadow-lg shadow-black/10
            transition-all duration-200
            ${disabled 
              ? 'cursor-not-allowed opacity-50' 
              : 'hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            }
          `}
        />

        {/* Loading Spinner or Clear Button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 text-gray-400"
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
          ) : value ? (
            <button
              onClick={onClear}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Clear search"
            >
              <svg
                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : null}
        </div>
      </div>

      {/* Stream Search Label */}
      <div className="absolute -top-2 left-3 px-1 bg-white text-xs text-gray-600 font-medium">
        Stream Search
      </div>
    </div>
  );
};

export default StreamSearchInput;