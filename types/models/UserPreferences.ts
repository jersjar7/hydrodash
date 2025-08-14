// types/models/UserPreferences.ts
/**
 * User preferences for display and behavior
 * Note: Internal app logic uses CFS/Celsius; these control display conversion
 */

export type FlowUnit = 'CFS' | 'CMS';
export type TempUnit = 'F' | 'C';
export type ThemePref = 'system' | 'light' | 'dark';

export interface UserPreferences {
  /** Display preference - internal logic stays in CFS */
  flowUnit: FlowUnit;
  /** Display preference - internal logic stays in Celsius */
  tempUnit: TempUnit;
  /** Theme preference */
  theme: ThemePref;
  /** Ordered list of saved place IDs */
  savedPlaceIds: string[];
  /** Ordered widget IDs for dashboard layout */
  widgetOrder?: string[];
  /** Auto-refresh dashboard data */
  autoRefresh?: boolean;
  /** Refresh interval in milliseconds */
  refreshInterval?: number;
  /** Sidebar collapsed state */
  collapsedSidebar?: boolean;
}