/** Helpers for Campaign.metadata JSON (propertyCode lives here until Prisma client is regenerated). */

export function asMetadataRecord(m: unknown): Record<string, unknown> {
  return m && typeof m === 'object' && !Array.isArray(m) ? (m as Record<string, unknown>) : {};
}

/** Hex property code from metadata — same semantics as Django format(int(home.id*10000), 'x'). */
export function getPropertyCodeFromMetadata(m: unknown): string | undefined {
  const v = asMetadataRecord(m).propertyCode;
  if (typeof v !== 'string' || !v.trim()) return undefined;
  return v.trim().toLowerCase();
}
