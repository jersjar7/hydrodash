// components/widgets/HydrographWidget.tsx
'use client';

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useAppContext, isRiverReach, getLocationProps } from '@/components/Layout/AppShell';
import { 
  useFlowData,
  useShortRangeForecast,
  useMediumRangeForecast,
  useLongRangeForecast 
} from '@/hooks/useFlowData';
import { getReachDisplayName } from '@/hooks/useReachMetadata';
import type { NormalizedFlowForecast, Horizon, RiskLevel } from '@/types';

interface HydrographWidgetProps {
  /** Custom className for styling */
  className?: string;
  /** Widget height */
  height?: number;
  /** Show forecast ranges toggle */
  showRangeSelector?: boolean;
  /** Show risk level indicators */
  showRiskLevels?: boolean;
  /** Custom data attribute for testing */
  'data-testid'?: string;
}

// Chart data point interface
interface ChartDataPoint {
  time: string;
  timestamp: number;
  short?: number;
  medium?: number;
  long?: number;
  formattedTime: string;
}

const HydrographWidget: React.FC<HydrographWidgetProps> = ({
  className = '',
  height = 400,
  showRangeSelector = true,
  showRiskLevels = true,
  'data-testid': testId,
}) => {
  // Get active location from AppShell context
  const { activeLocation, userPreferences } = useAppContext();
  const locationProps = getLocationProps(activeLocation);
  
  // State for which ranges to display
  const [selectedRanges, setSelectedRanges] = useState<Set<Horizon>>(() => 
    new Set(['short', 'medium'])
  );

  // Get reach ID if active location is a RiverReach
  const reachId = isRiverReach(activeLocation) ? activeLocation.reachId : locationProps?.reachId || null;
  
  // Fetch multiple forecast ranges
  const shortRange = useShortRangeForecast(reachId, { enabled: !!reachId && selectedRanges.has('short') });
  const mediumRange = useMediumRangeForecast(reachId, { enabled: !!reachId && selectedRanges.has('medium') });
  const longRange = useLongRangeForecast(reachId, { enabled: !!reachId && selectedRanges.has('long') });

  // Combine loading states
  const isLoading = shortRange.isLoading || mediumRange.isLoading || longRange.isLoading;
  
  // Combine error states
  const error = shortRange.error || mediumRange.error || longRange.error;

  // Transform forecast data into chart format
  const chartData = useMemo(() => {
    const dataMap = new Map<string, ChartDataPoint>();

    // Helper to add series data to the map
    const addSeriesToMap = (forecast: NormalizedFlowForecast | undefined, horizon: Horizon) => {
      if (!forecast?.series) return;

      forecast.series.forEach(series => {
        if (series.horizon === horizon) {
          series.points.forEach(point => {
            const timestamp = new Date(point.t).getTime();
            const timeKey = point.t;
            
            if (!dataMap.has(timeKey)) {
              dataMap.set(timeKey, {
                time: point.t,
                timestamp,
                formattedTime: new Date(point.t).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              });
            }

            const dataPoint = dataMap.get(timeKey)!;
            dataPoint[horizon] = point.q;
          });
        }
      });
    };

    // Add data from each range
    if (selectedRanges.has('short')) addSeriesToMap(shortRange.data, 'short');
    if (selectedRanges.has('medium')) addSeriesToMap(mediumRange.data, 'medium');
    if (selectedRanges.has('long')) addSeriesToMap(longRange.data, 'long');

    // Convert to array and sort by time
    return Array.from(dataMap.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [shortRange.data, mediumRange.data, longRange.data, selectedRanges]);

  // Get flow unit for formatting
  const flowUnit = userPreferences.flowUnit || 'CFS';

  // Format flow value for display
  const formatFlow = (value: number) => {
    if (flowUnit === 'CMS') {
      return (value / 35.314666721).toFixed(1);
    }
    return Math.round(value).toLocaleString();
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as ChartDataPoint;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-medium text-gray-900 dark:text-white mb-2">
          {data.formattedTime}
        </p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {entry.dataKey} Range
                </span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {formatFlow(entry.value)} {flowUnit}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Range toggle handler
  const toggleRange = (range: Horizon) => {
    setSelectedRanges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(range)) {
        newSet.delete(range);
      } else {
        newSet.add(range);
      }
      return newSet;
    });
  };

  // Get line colors for different ranges
  const getLineColor = (range: Horizon) => {
    const colors = {
      short: '#3B82F6', // Blue
      medium: '#10B981', // Green
      long: '#F59E0B', // Orange
    };
    return colors[range];
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        data-testid={testId}
      >
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        data-testid={testId}
      >
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Chart Data Unavailable
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Unable to load forecast data
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            {error.message}
          </p>
        </div>
      </div>
    );
  }

  // No data state
  if (!reachId || chartData.length === 0) {
    return (
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
        data-testid={testId}
      >
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            Flow Forecast Chart
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Select a stream on the map to view flow forecasts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
      data-testid={testId}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Flow Forecast
          </h3>
          {locationProps && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {locationProps.name}
            </p>
          )}
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">Live</span>
        </div>
      </div>

      {/* Range Selector */}
      {showRangeSelector && (
        <div className="flex items-center space-x-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Forecast Ranges:
          </span>
          <div className="flex space-x-2">
            {[
              { key: 'short' as Horizon, label: 'Short (18h)', description: 'Hourly' },
              { key: 'medium' as Horizon, label: 'Medium (10d)', description: 'Daily' },
              { key: 'long' as Horizon, label: 'Long (30d)', description: 'Weekly' },
            ].map(({ key, label, description }) => (
              <button
                key={key}
                onClick={() => toggleRange(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  selectedRanges.has(key)
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title={description}
              >
                <div 
                  className="w-2 h-2 rounded-full inline-block mr-1"
                  style={{ backgroundColor: getLineColor(key) }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="opacity-30" 
              stroke="currentColor"
            />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(timestamp: string | number | Date) => {
                const date = new Date(timestamp);
                return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
              }}
              className="text-gray-600 dark:text-gray-400"
              stroke="currentColor"
            />
            <YAxis
              tickFormatter={(value: number) => formatFlow(value)}
              label={{ 
                value: `Flow (${flowUnit})`, 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle' }
              } as {
                value: string;
                angle: number;
                position: string;
                style: { textAnchor: string };
              }}
              className="text-gray-600 dark:text-gray-400"
              stroke="currentColor"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              iconType="line"
              formatter={(value: string) => (
                <span className="capitalize text-gray-700 dark:text-gray-300">
                  {value} Range
                </span>
              )}
            />
            
            {/* Reference line for current time */}
            <ReferenceLine 
              x={Date.now()} 
              stroke="#6B7280" 
              strokeDasharray="2 2"
              label="Now"
            />

            {/* Data lines */}
            {selectedRanges.has('short') && (
              <Line
                type="monotone"
                dataKey="short"
                stroke={getLineColor('short')}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                name="Short"
              />
            )}
            {selectedRanges.has('medium') && (
              <Line
                type="monotone"
                dataKey="medium"
                stroke={getLineColor('medium')}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                name="Medium"
              />
            )}
            {selectedRanges.has('long') && (
              <Line
                type="monotone"
                dataKey="long"
                stroke={getLineColor('long')}
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                name="Long"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {chartData.length} data points
          </span>
          <span>
            Updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HydrographWidget;