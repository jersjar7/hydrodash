// components/Dashboard/LocationHeader.tsx
'use client';

import React from 'react';
import { SavedPlace } from '@/types/models/SavedPlace';
import { RiskLevel } from '@/types/models/FlowForecast';
import { FlowUnit, TempUnit } from '@/types/models/UserPreferences';
import FlowStatus from '@/components/display/FlowStatus';
import WeatherSummary, { WeatherData } from '@/components/display/WeatherSummary';
import LoadingSpinner from '@/components/common/LoadingSpinner';

interface QuickStats {
  /** Peak flow in the forecast period */
  peakFlow?: number;
  /** Trend direction (rising, falling, stable) */
  trend?: 'rising' | 'falling' | 'stable';
  /** Time to peak (in hours) */
  timeToPeak?: number;
  /** Last updated timestamp */
  lastUpdated?: string;
}

interface LocationHeaderProps {
  /** Current active location */
  location?: SavedPlace | null;
  /** Current flow data */
  flowData?: {
    flow: number;
    riskLevel: RiskLevel;
    loading?: boolean;
    error?: string;
  };
  /** Current weather data */
  weatherData?: {
    weather?: WeatherData;
    loading?: boolean;
    error?: string;
  };
  /** Quick statistics */
  quickStats?: QuickStats;
  /** Flow unit preference */
  flowUnit?: FlowUnit;
  /** Temperature unit preference */
  tempUnit?: TempUnit;
  /** Loading state for the entire header */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Custom className */
  className?: string;
  /** Callback to change location */
  onLocationChange?: () => void;
}

const LocationHeader: React.FC<LocationHeaderProps> = ({
  location,
  flowData,
  weatherData,
  quickStats,
  flowUnit = 'CFS',
  tempUnit = 'F',
  loading = false,
  error,
  className = '',
  onLocationChange,
}) => {
  // Get location type icon
  const getLocationIcon = () => {
    if (!location?.type) return null;
    
    switch (location.type) {
      case 'home':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
        );
      case 'work':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'recreation':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  // Get trend icon
  const getTrendIcon = () => {
    switch (quickStats?.trend) {
      case 'rising':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7h-10" />
          </svg>
        );
      case 'falling':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="px-6 py-4">
          <LoadingSpinner size="lg" variant="pulse" color="primary" text="Loading location..." />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="px-6 py-4 text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  // No location state
  if (!location) {
    return (
      <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="px-6 py-4 text-center">
          <div className="text-gray-400 mb-3">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            No location selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Choose a location from the sidebar to view its dashboard
          </p>
          {onLocationChange && (
            <button
              onClick={onLocationChange}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              Select location
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="px-6 py-4">
        {/* Main Header Row */}
        <div className="flex items-start justify-between mb-4">
          {/* Location Info */}
          <div className="flex items-start space-x-3">
            {/* Location Icon */}
            <div className="flex-shrink-0 mt-1">
              {getLocationIcon()}
            </div>
            
            {/* Location Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {location.name}
                </h1>
                {location.isPrimary && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    Primary
                  </span>
                )}
              </div>
              {location.type && (
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {location.type} location
                </p>
              )}
              {(location.lat && location.lon) && (
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                  {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Change Location Button */}
          {onLocationChange && (
            <button
              onClick={onLocationChange}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Change location"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>
          )}
        </div>

        {/* Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
          {/* Flow Status */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Flow
            </h3>
            {flowData?.loading ? (
              <LoadingSpinner size="sm" variant="dots" color="gray" />
            ) : flowData?.error ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Flow data unavailable
              </p>
            ) : flowData ? (
              <FlowStatus
                flow={flowData.flow}
                riskLevel={flowData.riskLevel}
                unit={flowUnit}
                variant="detailed"
              />
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No flow data
              </p>
            )}
          </div>

          {/* Weather */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Weather
            </h3>
            <WeatherSummary
              weather={weatherData?.weather}
              loading={weatherData?.loading}
              error={weatherData?.error}
              variant="card"
            />
          </div>

          {/* Quick Stats */}
          {quickStats && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Forecast Summary
              </h3>
              <div className="space-y-1">
                {quickStats.peakFlow && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Peak flow:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quickStats.peakFlow.toLocaleString()} {flowUnit}
                    </span>
                  </div>
                )}
                {quickStats.trend && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Trend:</span>
                    <div className="flex items-center space-x-1">
                      {getTrendIcon()}
                      <span className="font-medium text-gray-900 dark:text-white capitalize">
                        {quickStats.trend}
                      </span>
                    </div>
                  </div>
                )}
                {quickStats.timeToPeak && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Time to peak:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {quickStats.timeToPeak}h
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Last Updated */}
        {(quickStats?.lastUpdated || flowData || weatherData) && (
          <div className="text-xs text-gray-400 dark:text-gray-500">
            Last updated: {quickStats?.lastUpdated 
              ? new Date(quickStats.lastUpdated).toLocaleString()
              : 'Just now'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationHeader;