// types/models/RiverReach.ts
/**
 * River reach metadata from NOAA NWPS API
 */

// Branded type to prevent mixing up arbitrary strings with reach IDs
export type ReachId = string & { __brand: 'ReachId' };

export interface RouteReach {
  reachId: ReachId;
  /** API returns as string (e.g., "6") */
  streamOrder: string;
}

export interface ReachRoute {
  upstream: RouteReach[];
  downstream: RouteReach[];
}

export type StreamflowSeriesName =
  | "short_range"
  | "medium_range"
  | "long_range";

export interface RiverReach {
  reachId: ReachId;
  /** Optional: not all endpoints guarantee a friendly name */
  name?: string;
  latitude: number;
  longitude: number;
  /** Available series for this reach */
  streamflow: StreamflowSeriesName[];
  /** Optional for MVP — fetch on demand when needed */
  route?: ReachRoute;
}
