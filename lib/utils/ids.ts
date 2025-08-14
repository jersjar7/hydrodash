// lib/utils/ids.ts
import type { ReachId } from '@/types';
export const toReachId = (v: string | number): ReachId => String(v) as ReachId;
export const isReachId = (v: unknown): v is ReachId => typeof v === 'string';

