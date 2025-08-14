// types/index.ts
/**
 * Central Type Definitions for HydroDash
 * All shared types used across the application
 */

// Re-export app-level config types (types only)
export type { PublicConfig, SecretsConfig, AppConfig } from '@/config';

// Core model types
export * from './models/RiverReach';
export * from './models/FlowForecast';
export * from './models/ReturnPeriod';
export * from './models/SavedPlace';
export * from './models/UserPreferences';
export * from './models/WidgetConfig';
export * from './models/WeatherForecast'; // include placeholder
export * from './utils';

// App-level primitives
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

// Common widget properties
export interface BaseWidget {
  id: string;
  type: string;
  title: string;
  order: number;
  isLoading?: boolean;
  error?: string;
}

// Time series data point (used by multiple widgets)
export interface TimeSeriesPoint {
  /** ISO UTC timestamp string */
  timestamp: string;
  value: number;
  unit?: string;
}

// Color theme preference
export type Theme = 'light' | 'dark' | 'system';