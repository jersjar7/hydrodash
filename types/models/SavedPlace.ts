/**
 * User's saved monitoring locations
 */

export type PlaceType = "home" | "work" | "recreation" | "other";

export interface SavedPlace {
  id: string;
  name: string;
  type?: PlaceType;
  /** Either reachId OR coordinates are required to resolve data */
  reachId?: string;
  latitude?: number;
  longitude?: number;
  isPrimary?: boolean;
  notes?: string;
  /** ISO strings */
  createdAt?: string;
  updatedAt?: string;
}
