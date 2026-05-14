/**
 * Server-side proxy for Openhouse property search.
 *
 * The browser calls GET /api/property-search?q=... (same origin — no CORS).
 * This route forwards the request server-side to the Django backend.
 *
 * Strategy:
 *   1. Try /get-homes/?search= first — always returns propertyCode (required for FCM redirect).
 *   2. If get-homes returns 0 results, try semantic/hybrid search as fallback.
 *   3. Filter out any homes missing propertyCode before returning.
 *
 * Django hex encoding (same as send_property_notification):
 *   propertyCode = format(int(home.id * 10000), 'x')   # lowercase hex
 */
import { NextRequest, NextResponse } from "next/server"

const OH_API =
  process.env.OH_API_URL ??
  process.env.NEXT_PUBLIC_OH_API_URL ??
  "https://backend-prod-561394753846.asia-south2.run.app/api/v1/oh"

const EMPTY = { homes: [], pagination: { limit: 10, offset: 0, nextOffset: null, hasMore: false } }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasPropertyCode(h: any): boolean {
  return typeof h?.propertyCode === "string" && h.propertyCode.trim().length > 0
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get("q")?.trim()
  const limit = Number(searchParams.get("limit") ?? "10")

  if (!q) return NextResponse.json(EMPTY)

  // ── 1. Keyword search via /get-homes/ ─────────────────────────────────────
  // This endpoint always returns propertyCode (the hex ID needed for FCM redirect).
  try {
    const url = new URL(`${OH_API}/get-homes/`)
    url.searchParams.set("search", q)
    url.searchParams.set("limit", String(limit))

    const res = await fetch(url.toString(), { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data?.homes)) {
        const homes = data.homes.filter(hasPropertyCode)
        if (homes.length > 0) {
          return NextResponse.json({ homes, pagination: data.pagination ?? EMPTY.pagination })
        }
      }
    }
  } catch {
    // fall through to semantic
  }

  // ── 2. Semantic / hybrid search fallback ──────────────────────────────────
  // Typesense documents may or may not carry propertyCode; we filter strictly.
  try {
    const url = new URL(`${OH_API}/search/homes/semantic/`)
    url.searchParams.set("q", q)
    url.searchParams.set("per_page", String(limit))
    url.searchParams.set("mode", "hybrid")

    const res = await fetch(url.toString(), { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()

      // Shape A: { homes: [...] }
      if (Array.isArray(data?.homes)) {
        const homes = data.homes.filter(hasPropertyCode)
        if (homes.length > 0) {
          return NextResponse.json({ homes, pagination: data.pagination ?? EMPTY.pagination })
        }
      }

      // Shape B: Typesense multi-search { results: [{ hits: [...] }] }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hits: any[] = data?.results?.[0]?.hits ?? []
      if (hits.length > 0) {
        const homes = hits
          .map((h) => h.document ?? h.home ?? h)
          .filter(hasPropertyCode)
        if (homes.length > 0) {
          return NextResponse.json({ homes, pagination: EMPTY.pagination })
        }
      }
    }
  } catch {
    // ignore
  }

  return NextResponse.json(EMPTY)
}
