// types/models/SavedPlace.ts
/**
 * User's saved monitoring locations
 */

import type { ReachId } from "./RiverReach";

export interface SavedPlace {
  id: string;
  name: string;
  /** Either reachId OR coordinates are required to resolve data */
  reachId?: ReachId;
  lat?: number;
  lon?: number;
  isPrimary?: boolean;
  notes?: string;
  photoUrl?: string;
  /** ISO timestamp - required for tracking */
  createdAt: string;
  /** ISO timestamp - updated when place is modified */
  updatedAt?: string;
}