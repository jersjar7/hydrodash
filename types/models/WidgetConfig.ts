/**
 * Simplified widget configuration for MVP
 */

export type WidgetType =
  | "hydrograph"
  | "risk-gauge"
  | "weather-summary"
  | "precipitation-chart"
  | "statistics";

export interface WidgetSource {
  reachId?: string;
  lat?: number;
  lon?: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  /** Simple ordering for DnD; no x,y,w,h yet */
  order: number;
  source: WidgetSource;
  settings?: Record<string, unknown>;
  isVisible?: boolean;
}
