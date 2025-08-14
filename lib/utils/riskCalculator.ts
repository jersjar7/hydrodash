// lib/utils/riskCalculator.ts
import type { RiskLevel, ReturnPeriodThresholds } from '@/types';

export function computeRisk(qCfs: number, rp: ReturnPeriodThresholds): RiskLevel {
  if (qCfs >= rp.rp50) return 'flood';
  if (qCfs >= rp.rp25)  return 'high';
  if (qCfs >= rp.rp2)   return 'elevated';
  return 'normal';
}
