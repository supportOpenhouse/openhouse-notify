"use client"

import * as React from "react"
import { Plus, Trash2, Users, Star } from "lucide-react"
import { toast } from "sonner"
import { useSegments, useDeleteSegment } from "@/hooks/use-audience"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { Separator } from "@/components/ui/separator"
import { AudienceSegment } from "@/lib/types/audience"
import { format } from "date-fns"
import { NewSegmentSheet } from "@/features/audience/components/new-segment-sheet"

function SegmentCard({ segment, onDelete }: { segment: AudienceSegment; onDelete: (id: string) => void }) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-sm text-foreground truncate">{segment.name}</p>
              {segment.isFavorite && <Star className="size-3.5 fill-amber-400 text-amber-400 shrink-0" />}
            </div>
            {segment.description && (
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{segment.description}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(segment.id)}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
            <p className="font-bold text-foreground">{segment.estimatedSize.toLocaleString()}</p>
            <p className="text-muted-foreground">Estimated</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
            <p className="font-bold text-foreground">{segment.reachableTokens.toLocaleString()}</p>
            <p className="text-muted-foreground">Reachable</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-2 py-1.5 text-center">
            <p className="font-bold text-foreground">{segment.usageCount}</p>
            <p className="text-muted-foreground">Used</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          {segment.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
              {tag}
            </Badge>
          ))}
        </div>

        <Separator className="my-3" />
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>By {segment.createdBy}</span>
          <span>Updated {format(new Date(segment.updatedAt), "MMM d")}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function AudienceModule() {
  const { data: segments = [], isLoading } = useSegments()
  const deleteMutation = useDeleteSegment()
  const [sheetOpen, setSheetOpen] = React.useState(false)

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Segment deleted"),
      onError: () => toast.error("Failed to delete segment"),
    })
  }

  return (
    <div className="space-y-4">
      <NewSegmentSheet open={sheetOpen} onOpenChange={setSheetOpen} />
      <PageHeader
        title="Audience Segments"
        description="Build and manage reusable audience segments for targeted campaigns"
        breadcrumbs={[{ label: "Admin" }, { label: "Audience" }]}
        actions={
          <Button size="sm" onClick={() => setSheetOpen(true)}>
            <Plus className="mr-1.5 size-3.5" />
            New Segment
          </Button>
        }
      />

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Segments", value: segments.length },
          { label: "Avg. Segment Size", value: segments.length > 0 ? Math.round(segments.reduce((a, s) => a + s.estimatedSize, 0) / segments.length).toLocaleString() : "—" },
          { label: "Favorites", value: segments.filter((s) => s.isFavorite).length },
          { label: "Total Reachable", value: segments.reduce((a, s) => a + s.reachableTokens, 0).toLocaleString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border/80 bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="mt-0.5 text-xl font-bold text-foreground">{isLoading ? "—" : stat.value}</p>
          </div>
        ))}
      </div>

      {/* Segment grid */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <div className="grid grid-cols-3 gap-2">
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                  <Skeleton className="h-12" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : segments.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="No segments yet"
          description="Create audience segments to target specific groups of brokers"
          action={{ label: "Create Segment", onClick: () => setSheetOpen(true) }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {segments.map((seg) => (
            <SegmentCard key={seg.id} segment={seg} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Condition builder hint */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-4 px-5 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Visual Condition Builder</p>
            <p className="text-xs text-muted-foreground">
              AND/OR condition groups with city, platform, engagement level, app version, and custom tag filters — available in full build.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
