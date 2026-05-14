"use client"

import * as React from "react"
import { Copy, Star, StarOff, Trash2, BellRing, Plus, Search } from "lucide-react"
import { toast } from "sonner"
import { format } from "date-fns"
import { useTemplates, useCloneTemplate, useToggleFavoriteTemplate, useDeleteTemplate } from "@/hooks/use-templates"
import { NotificationTemplate, TemplateCategory } from "@/lib/types/template"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { useDebounce } from "@/hooks/use-debounce"

const CATEGORY_OPTIONS: { label: string; value: TemplateCategory | "__all__" }[] = [
  { label: "All categories", value: "__all__" },
  { label: "Promotional", value: "promotional" },
  { label: "Transactional", value: "transactional" },
  { label: "Re-engagement", value: "reengagement" },
  { label: "Announcement", value: "announcement" },
  { label: "Welcome", value: "welcome" },
  { label: "Alert", value: "alert" },
]

const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  promotional: "border-violet-500/30 bg-violet-500/10 text-violet-700",
  transactional: "border-blue-500/30 bg-blue-500/10 text-blue-700",
  reengagement: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  announcement: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  welcome: "border-pink-500/30 bg-pink-500/10 text-pink-700",
  reminder: "border-orange-500/30 bg-orange-500/10 text-orange-700",
  alert: "border-red-500/30 bg-red-500/10 text-red-700",
}

function TemplateCard({ template, onClone, onToggleFavorite, onDelete }: {
  template: NotificationTemplate
  onClone: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
  onDelete: (id: string) => void
}) {
  return (
    <Card className="group flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold">{template.name}</p>
              <span className={`shrink-0 inline-flex items-center rounded-md border px-1.5 py-0 text-[10px] font-medium ${CATEGORY_COLORS[template.category]}`}>
                {template.category}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{template.description}</p>
          </div>
          <button
            type="button"
            onClick={() => onToggleFavorite(template.id, !template.isFavorite)}
            className="text-muted-foreground hover:text-amber-500 transition-colors"
          >
            {template.isFavorite ? <Star className="size-4 fill-amber-400 text-amber-400" /> : <StarOff className="size-4" />}
          </button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        {/* Preview */}
        <div className="rounded-lg bg-muted/40 p-3 text-xs space-y-1">
          <p className="font-semibold text-foreground line-clamp-1">{template.title}</p>
          {template.subtitle && <p className="text-muted-foreground line-clamp-1">{template.subtitle}</p>}
          <p className="text-muted-foreground line-clamp-2">{template.body}</p>
        </div>

        {/* Variables */}
        {template.variables.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.variables.map((v) => (
              <span key={v.key} className="inline-flex items-center rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {`{{${v.key}}}`}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="text-[11px] text-muted-foreground">
            Used {template.usageCount}×
            {template.lastUsedAt && ` · ${format(new Date(template.lastUsedAt), "MMM d")}`}
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button variant="ghost" size="icon-sm" onClick={() => onClone(template.id)} title="Clone template">
              <Copy className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => onDelete(template.id)} title="Delete template" className="hover:text-destructive">
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TemplateModule() {
  const [search, setSearch] = React.useState("")
  const [category, setCategory] = React.useState<TemplateCategory | "">("")
  const debouncedSearch = useDebounce(search, 300)

  const { data: templates = [], isLoading } = useTemplates({ search: debouncedSearch, category: category || undefined })
  const cloneMutation = useCloneTemplate()
  const favMutation = useToggleFavoriteTemplate()
  const deleteMutation = useDeleteTemplate()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notification Templates"
        description="Reusable templates with dynamic variables for consistent messaging"
        breadcrumbs={[{ label: "Admin" }, { label: "Templates" }]}
        actions={
          <Button size="sm">
            <Plus className="mr-1.5 size-3.5" />
            New Template
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 w-48 text-xs"
          />
        </div>
        <Select
          value={category || "__all__"}
          onValueChange={(v) => setCategory((v === "__all__" ? "" : v) as TemplateCategory | "")}
        >
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            {CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-20" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={<BellRing className="size-6" />}
          title="No templates found"
          description="Create reusable notification templates with dynamic variables"
          action={{ label: "Create Template", onClick: () => {} }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <TemplateCard
              key={tpl.id}
              template={tpl}
              onClone={(id) => cloneMutation.mutate(id, { onSuccess: () => toast.success("Template cloned") })}
              onToggleFavorite={(id, isFav) => favMutation.mutate({ id, isFavorite: isFav })}
              onDelete={(id) => deleteMutation.mutate(id, { onSuccess: () => toast.success("Template deleted") })}
            />
          ))}
        </div>
      )}
    </div>
  )
}
