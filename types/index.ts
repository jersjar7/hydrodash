/**
 * Central Type Definitions for HydroDash
 * All shared types used across the application
 */

// Re-export configuration types
export type { PublicConfig, SecretsConfig, AppConfig } from '@/config';

// Geographic coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
  timestamp: string;
}

// Pagination support
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
  timestamp: Date | string;
  value: number;
  unit?: string;
}

// Risk levels for various metrics
export type RiskLevel = 'low' | 'normal' | 'elevated' | 'high' | 'extreme';

// Color theme
export type Theme = 'light' | 'dark' | 'auto';

// Common error types
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public endpoint: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// Utility type for making properties optional
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Utility type for making properties required
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Type guard for checking if value is defined
export const isDefined = <T>(value: T | undefined | null): value is T => {
  return value !== undefined && value !== null;
};