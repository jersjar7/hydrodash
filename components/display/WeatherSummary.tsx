// components/display/WeatherSummary.tsx
'use client';

import React from 'react';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export type WeatherCondition = 
  | 'clear' | 'partly-cloudy' | 'cloudy' | 'overcast'
  | 'rain' | 'showers' | 'thunderstorm' 
  | 'snow' | 'fog' | 'wind';

export type TempUnit = 'F' | 'C';

export interface WeatherData {
  /** Current temperature */
  temperature: number;
  /** Temperature unit */
  tempUnit: TempUnit;
  /** Weather condition */
  condition: WeatherCondition;
  /** Precipitation probability (0-100) */
  precipChance?: number;
  /** Current precipitation amount */
  precipAmount?: number;
  /** High temperature for the day */
  highTemp?: number;
  /** Low temperature for the day */
  lowTemp?: number;
}

interface WeatherSummaryProps {
  /** Weather data to display */
  weather?: WeatherData;
  /** Loading state */
  loading?: boolean;
  /** Error state */
  error?: string;
  /** Display variant */
  variant?: 'compact' | 'card';
  /** Custom className */
  className?: string;
}

// Weather condition icons and styling
const weatherIcons = {
  clear: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-yellow-500',
  },
  'partly-cloudy': {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
      </svg>
    ),
    color: 'text-gray-500',
  },
  cloudy: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
      </svg>
    ),
    color: 'text-gray-600',
  },
  overcast: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
      </svg>
    ),
    color: 'text-gray-700',
  },
  rain: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.5 7a4.5 4.5 0 10-8.5 2.5v.5a2.5 2.5 0 001.5 2.29V17a1 1 0 002 0v-4.21a2.5 2.5 0 00-1.5-2.29V10a2.5 2.5 0 015 0 1 1 0 002 0 4.5 4.5 0 00-.5-2z" />
      </svg>
    ),
    color: 'text-blue-500',
  },
  showers: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13.5 7a4.5 4.5 0 10-8.5 2.5v.5a2.5 2.5 0 001.5 2.29V17a1 1 0 002 0v-4.21a2.5 2.5 0 00-1.5-2.29V10a2.5 2.5 0 015 0 1 1 0 002 0 4.5 4.5 0 00-.5-2z" />
      </svg>
    ),
    color: 'text-blue-600',
  },
  thunderstorm: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-purple-600',
  },
  snow: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13zm-6 3a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h.01a1 1 0 100-2H10zm3 0a1 1 0 000 2h.01a1 1 0 100-2H13z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-blue-300',
  },
  fog: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-gray-400',
  },
  wind: {
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M6 3a1 1 0 000 2h8a1 1 0 100-2H6zM4 7a1 1 0 000 2h12a1 1 0 100-2H4zm-2 4a1 1 0 000 2h16a1 1 0 100-2H2z" clipRule="evenodd" />
      </svg>
    ),
    color: 'text-gray-500',
  },
};

const WeatherSummary: React.FC<WeatherSummaryProps> = ({
  weather,
  loading = false,
  error,
  variant = 'compact',
  className = '',
}) => {
  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <LoadingSpinner size="sm" variant="dots" color="gray" />
      </div>
    );
  }

  // Error state
  if (error || !weather) {
    return (
      <div className={`text-gray-500 dark:text-gray-400 text-sm ${className}`}>
        Weather unavailable
      </div>
    );
  }

  const weatherInfo = weatherIcons[weather.condition];

  if (variant === 'card') {
    return (
      <div className={`bg-gray-50 dark:bg-gray-800 rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className={weatherInfo.color}>
              {weatherInfo.icon}
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {weather.temperature}°{weather.tempUnit}
            </span>
          </div>
          {weather.precipChance !== undefined && weather.precipChance > 0 && (
            <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{weather.precipChance}%</span>
            </div>
          )}
        </div>
        
        {(weather.highTemp !== undefined || weather.lowTemp !== undefined) && (
          <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
            {weather.highTemp !== undefined && (
              <span>H: {weather.highTemp}°</span>
            )}
            {weather.lowTemp !== undefined && (
              <span>L: {weather.lowTemp}°</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Compact variant (default)
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={weatherInfo.color}>
        {weatherInfo.icon}
      </div>
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {weather.temperature}°{weather.tempUnit}
      </span>
      {weather.precipChance !== undefined && weather.precipChance > 0 && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-blue-600 dark:text-blue-400">
            {weather.precipChance}%
          </span>
        </>
      )}
    </div>
  );
};

export default WeatherSummary;