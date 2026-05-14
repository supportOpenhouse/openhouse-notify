/**
 * Property search — calls the local Next.js proxy route (/api/property-search)
 * so the browser never directly touches the Django backend (avoids CORS).
 *
 * The proxy (app/api/property-search/route.ts) forwards to OH_API_URL server-side.
 */

export interface PropertySearchResult {
  propertyCode: string  // hex — ready to attach to FCM notification
  slug: string
  name: string          // "{unit} · {societyName}"
  society: string
  unit: string
  layout: string        // "3 BHK"
  sqft: number | null
  listingStatus: string
  price: string         // "₹1.25 Cr"
  floor: number | null
  photo: string | null
}

function formatPrice(total: string | number | null | undefined): string {
  if (!total) return ""
  const n = typeof total === "string" ? parseFloat(total) : total
  if (!n || isNaN(n)) return ""
  const crore = n / 10_000_000
  return `₹${crore.toFixed(2)} Cr`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapHome(h: any): PropertySearchResult {
  const unit = [h.unitAddressLine1, h.unitAddressLine2].filter(Boolean).join("-")
  const society = h.societyName ?? ""
  const layoutName = typeof h.layout === "object" ? (h.layout?.name ?? "") : (h.layout ?? "")
  const sqft =
    typeof h.layout === "object" ? (h.layout?.superBuiltUp ?? null) : null

  // Keep original case from API (e.g. "227C20") — service layer lowercases before sending to FCM.
  const propertyCode = String(h.propertyCode ?? "").trim()

  return {
    propertyCode,
    slug: h.slug ?? "",
    name: [unit, society].filter(Boolean).join(" · "),
    society,
    unit,
    layout: layoutName,
    sqft,
    listingStatus: h.listingStatus ?? "",
    price: formatPrice(typeof h.price === "object" ? h.price?.total : h.price),
    floor: h.floor ?? null,
    photo: h.homePhoto ?? null,
  }
}

export async function searchProperties(
  query: string,
  limit = 10,
): Promise<PropertySearchResult[]> {
  if (!query.trim()) return []

  try {
    // Call the local Next.js proxy — no CORS issues since same origin
    const url = new URL("/api/property-search", window.location.origin)
    url.searchParams.set("q", query.trim())
    url.searchParams.set("limit", String(limit))

    const res = await fetch(url.toString(), { cache: "no-store" })
    if (!res.ok) return []

    const data = await res.json()

    // Shape 1: { homes: [...] }
    if (Array.isArray(data?.homes)) {
      return data.homes
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((h: any) => mapHome(h))
        // Only keep results that have a valid propertyCode — required for FCM redirect
        .filter((r: PropertySearchResult) => r.propertyCode.length > 0)
        .slice(0, limit)
    }
  } catch {
    // ignore — return empty below
  }

  return []
}
