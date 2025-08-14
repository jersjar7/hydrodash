/**
 * River reach metadata from NOAA NWPS API
 */

export interface RouteReach {
  reachId: string;
  /** API returns as string (e.g., "6") */
  streamOrder: string;
}

export interface ReachRoute {
  upstream: RouteReach[];
  downstream: RouteReach[];
}

export type StreamflowSeriesName =
  | "analysis_assimilation"
  | "short_range"
  | "medium_range"
  | "medium_range_blend"
  | "long_range";

export interface RiverReach {
  reachId: string;
  /** Optional: not all endpoints guarantee a friendly name */
  name?: string;
  latitude: number;
  longitude: number;
  /** Available series for this reach */
  streamflow: StreamflowSeriesName[];
  /** Optional for MVP — fetch on demand when needed */
  route?: ReachRoute;
}
