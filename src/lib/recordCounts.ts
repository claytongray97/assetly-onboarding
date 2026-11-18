import type { DataTypeId } from "./catalog";
import type { COMPANY_SIZES } from "./schemas";

type CompanySize = (typeof COMPANY_SIZES)[number];

/** Rough record volume per data type for a ~200-person company. */
const BASE: Record<DataTypeId, number> = {
  assets: 1800,
  users: 220,
  financial: 2600,
  locations: 14,
  vendors: 160,
  contracts: 90,
  licenses: 480,
  iot: 42000,
};

const SIZE_MULTIPLIER: Record<CompanySize, number> = {
  "1–50": 0.2,
  "51–200": 0.8,
  "201–1,000": 3,
  "1,001–5,000": 12,
  "5,000+": 40,
};

/** FNV-1a string hash → stable 32-bit unsigned int. */
export function hash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic, realistic-looking record count. The same inputs always yield
 * the same number so screenshots and tests are stable.
 */
export function recordCount(systemId: string, dataType: DataTypeId, size: CompanySize): number {
  const jitter = 0.75 + (hash(`${systemId}:${dataType}`) % 1000) / 2000; // 0.75–1.25
  return Math.max(1, Math.round(BASE[dataType] * SIZE_MULTIPLIER[size] * jitter));
}

/** Sum of all per-data-type counts for one integration. */
export function sumCounts(counts: Partial<Record<DataTypeId, number>> | undefined): number {
  return Object.values(counts ?? {}).reduce((a, b) => a + (b ?? 0), 0);
}
