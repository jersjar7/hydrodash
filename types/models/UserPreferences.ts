/**
 * Minimal user preferences for MVP
 */

export type ThemeMode = "light" | "dark" | "system";
export type TemperatureUnit = "fahrenheit" | "celsius";
export type FlowUnit = "cfs" | "cms";

export interface UserPreferences {
  theme: ThemeMode;
  units: {
    temperature: TemperatureUnit;
    /** Default: "cfs" for US users */
    flow: FlowUnit;
  };
  autoRefresh?: boolean;
  /** milliseconds */
  refreshInterval?: number;
  collapsedSidebar?: boolean;
}
