// lib/utils/units.ts

/** Cubic feet per second in one cubic meter per second */
export const CFS_PER_CMS = 35.314666721;
/** Millimeters in one inch */
export const MM_PER_IN = 25.4;

/** Convert cubic meters per second to cubic feet per second */
export const cmsToCfs = (cms: number) => cms * CFS_PER_CMS;
/** Convert cubic feet per second to cubic meters per second */
export const cfsToCms = (cfs: number) => cfs / CFS_PER_CMS;

/** Convert Celsius to Fahrenheit */
export const cToF = (c: number) => (c * 9) / 5 + 32;
/** Convert Fahrenheit to Celsius */
export const fToC = (f: number) => ((f - 32) * 5) / 9;

/** Convert millimeters to inches */
export const mmToIn = (mm: number) => mm / MM_PER_IN;
/** Convert inches to millimeters */
export const inToMm = (inch: number) => inch * MM_PER_IN;

/**
 * Best-effort unit parser for streamflow series.
 * Returns flow in CFS when possible; otherwise returns value unchanged.
 */
export function toCfs(value: number, units?: string | null): number {
  if (!units) return value;

  const u = units.toLowerCase().replace(/\s+/g, "");
  // common variants
  if (u.includes("m3/s") || u.includes("m^3/s") || u.includes("m³/s") || u.includes("cms")) {
    return cmsToCfs(value);
  }
  if (u.includes("ft3/s") || u.includes("ft^3/s") || u.includes("ft³/s") || u.includes("cfs")) {
    return value; // already CFS
  }
  // unknown units -> passthrough (you may want to warn)
  return value;
}