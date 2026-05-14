"use client"

import * as React from "react"
import Image from "next/image"
import { Search, X, CheckCircle2, Loader2, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { searchProperties, type PropertySearchResult } from "@/services/property-search"

interface PropertySearchPickerProps {
  value: string           // current propertyCode (hex)
  onChange: (code: string) => void
}

const STATUS_COLOR: Record<string, string> = {
  Ready:          "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
  "Coming soon":  "bg-amber-500/15  text-amber-700  border-amber-500/30",
  Booked:         "bg-blue-500/15   text-blue-700   border-blue-500/30",
  Sold:           "bg-rose-500/15   text-rose-700   border-rose-500/30",
  Archive:        "bg-zinc-500/15   text-zinc-500   border-zinc-500/30",
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={cn(
        "rounded-full px-1.5 py-0 text-[10px]",
        STATUS_COLOR[status] ?? "bg-muted text-muted-foreground border-border",
      )}
    >
      {status}
    </Badge>
  )
}

function PropertyPhoto({
  src,
  alt,
  size = 48,
}: {
  src: string | null
  alt: string
  size?: number
}) {
  if (!src) {
    return (
      <div
        className="shrink-0 rounded bg-muted flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Building2 className="size-4 text-muted-foreground" />
      </div>
    )
  }
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded"
      style={{ width: size, height: size }}
    >
      <Image src={src} alt={alt} fill className="object-cover" unoptimized />
    </div>
  )
}

function PropertyMeta({ prop }: { prop: PropertySearchResult }) {
  const parts: string[] = []
  if (prop.layout) parts.push(prop.layout)
  if (prop.sqft) parts.push(`${prop.sqft} sqft`)
  if (prop.floor != null) parts.push(`Floor ${prop.floor}`)
  if (prop.price) parts.push(prop.price)
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {parts.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && <span className="text-muted-foreground/40">·</span>}
          <span>{p}</span>
        </React.Fragment>
      ))}
      {prop.listingStatus && <StatusBadge status={prop.listingStatus} />}
    </div>
  )
}

export function PropertySearchPicker({ value, onChange }: PropertySearchPickerProps) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<PropertySearchResult[]>([])
  const [loading, setLoading] = React.useState(false)
  const [selected, setSelected] = React.useState<PropertySearchResult | null>(null)
  const [open, setOpen] = React.useState(false)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  React.useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      setOpen(false)
      setLoading(false)
      return
    }
    setLoading(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchProperties(query)
        setResults(res)
        setOpen(true)
      } catch {
        setResults([])
        setOpen(false)
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  function handleSelect(prop: PropertySearchResult) {
    setSelected(prop)
    onChange(prop.propertyCode)
    setQuery("")
    setResults([])
    setOpen(false)
  }

  function handleClear() {
    setSelected(null)
    onChange("")
    setQuery("")
  }

  return (
    <div className="space-y-2">
      <Label>
        Property{" "}
        <span className="font-normal text-xs text-muted-foreground">
          — tap opens Property Details in app
        </span>
      </Label>

      {/* Selected card */}
      {selected ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-500/40 bg-emerald-500/[0.06] p-3">
          <PropertyPhoto src={selected.photo} alt={selected.name} size={52} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate text-sm font-medium text-foreground">{selected.name}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-6 shrink-0 p-0 text-muted-foreground hover:text-destructive"
                onClick={handleClear}
              >
                <X className="size-3" />
              </Button>
            </div>
            <PropertyMeta prop={selected} />
            <div className="mt-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="size-3 shrink-0 text-emerald-600" />
              <p className="font-mono text-[11px] text-emerald-700">
                {selected.propertyCode}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div ref={containerRef} className="relative">
          {/* Search input */}
          <div className="relative">
            {loading ? (
              <Loader2 className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
            ) : (
              <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            )}
            <Input
              placeholder="Search society, unit, layout, area…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-8"
              onFocus={() => results.length > 0 && setOpen(true)}
            />
            {query && (
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setQuery("")
                  setResults([])
                  setOpen(false)
                }}
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* Results dropdown */}
          {open && (
            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {results.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                    <Building2 className="size-4 shrink-0" />
                    No properties found
                  </div>
                ) : (
                  results.map((prop) => (
                    <button
                      key={prop.propertyCode}
                      type="button"
                      className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                      onClick={() => handleSelect(prop)}
                    >
                      <PropertyPhoto src={prop.photo} alt={prop.name} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium leading-tight text-foreground">
                          {prop.name}
                        </p>
                        <PropertyMeta prop={prop} />
                        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">
                          {prop.propertyCode}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fallback: paste hex directly */}
      {!selected && (
        <div>
          <p className="text-[11px] text-muted-foreground mb-1">
            Or paste hex code directly (e.g.{" "}
            <code className="rounded bg-muted px-1">138800</code>)
          </p>
          <Input
            placeholder="138800"
            value={value}
            onChange={(e) => onChange(e.target.value.trim())}
            className="font-mono text-sm"
          />
        </div>
      )}
    </div>
  )
}
