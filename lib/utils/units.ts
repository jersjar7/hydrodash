// lib/utils/units.ts
export const CMS_TO_CFS = 35.3146667 as const;

export function cmsToCfs(value: number): number {
  return value * CMS_TO_CFS;
}

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
