// types/models/WidgetConfig.ts
/**
 * Widget configuration with discriminated union for type safety
 */

import type { ReachId } from "./RiverReach";

export type WidgetType =
  | "hydrograph"
  | "risk-gauge"
  | "weather-summary"
  | "precipitation-chart"
  | "statistics";

export interface BaseWidgetConfig {
  id: string;
  type: WidgetType;
  title?: string;
  isVisible?: boolean;
  // Optional dashboard layout (for future grid system)
  row?: number;
  col?: number;
  w?: number;
  h?: number;
}

export interface HydrographWidgetConfig extends BaseWidgetConfig {
  type: "hydrograph";
  reachId: ReachId;
}

export interface RiskGaugeWidgetConfig extends BaseWidgetConfig {
  type: "risk-gauge";
  reachId: ReachId;
}

export interface WeatherSummaryWidgetConfig extends BaseWidgetConfig {
  type: "weather-summary";
  lat: number;
  lon: number;
}

export interface PrecipitationChartWidgetConfig extends BaseWidgetConfig {
  type: "precipitation-chart";
  lat: number;
  lon: number;
}

export interface StatisticsWidgetConfig extends BaseWidgetConfig {
  type: "statistics";
  reachId: ReachId;
  settings?: {
    period?: "24h" | "7d" | "30d";
    metrics?: string[];
  };
}

export type WidgetConfig =
  | HydrographWidgetConfig
  | RiskGaugeWidgetConfig
  | WeatherSummaryWidgetConfig
  | PrecipitationChartWidgetConfig
  | StatisticsWidgetConfig;