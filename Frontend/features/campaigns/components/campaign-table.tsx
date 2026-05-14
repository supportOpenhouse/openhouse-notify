"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontal, RotateCcw, XCircle, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
import { CampaignFlat, CampaignStatus } from "@/lib/types/notification"
import { DataTable } from "@/components/data-table/data-table"
import { DataTablePagination } from "@/components/data-table/data-table-pagination"
import { StatusBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/shared/empty-state"
import { useCampaignHistory, useCancelCampaign } from "@/hooks/use-notification-campaigns"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { setFilter, resetFilters, setExpandedRow, setPage, setSort } from "@/store/slices/campaigns-slice"
import { useDebounce } from "@/hooks/use-debounce"
import { CAMPAIGN_STATUS_CONFIG } from "@/lib/constants/campaign.constants"
import { toast } from "sonner"

function SubRow({ row }: { row: CampaignFlat }) {
  const deliveryRate = row.totalCount > 0
    ? Math.round((row.sentCount / row.totalCount) * 1000) / 10
    : 0

  return (
    <div className="grid grid-cols-3 gap-4 py-1 text-xs sm:grid-cols-4 lg:grid-cols-5">
      {[
        { label: "Total Recipients", value: row.totalCount.toLocaleString() },
        { label: "Sent", value: row.sentCount.toLocaleString() },
        { label: "Failed", value: row.failedCount.toLocaleString() },
        { label: "Delivery Rate", value: deliveryRate > 0 ? `${deliveryRate}%` : "—" },
        { label: "Audience", value: row.audienceType },
      ].map((m) => (
        <div key={m.label}>
          <p className="text-muted-foreground">{m.label}</p>
          <p className="mt-0.5 font-semibold text-foreground">{m.value}</p>
        </div>
      ))}
      {row.totalCount > 0 && (
        <div className="col-span-3 sm:col-span-4 lg:col-span-5">
          <p className="mb-1 text-muted-foreground">Progress</p>
          <Progress
            value={(row.sentCount / row.totalCount) * 100}
            className="h-1.5"
            indicatorClassName={row.failedCount > 0 ? "bg-amber-500" : "bg-emerald-500"}
          />
        </div>
      )}
    </div>
  )
}

export function CampaignTable() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((s) => s.campaigns.filters)
  const expandedRowId = useAppSelector((s) => s.campaigns.expandedRowId)

  const [localSearch, setLocalSearch] = React.useState(filters.search)
  const debouncedSearch = useDebounce(localSearch, 350)

  React.useEffect(() => {
    dispatch(setFilter({ key: "search", value: debouncedSearch }))
  }, [debouncedSearch, dispatch])

  const { data, isLoading } = useCampaignHistory()
  const cancelMutation = useCancelCampaign()

  const items = data?.data?.items ?? []
  const totalItems = data?.data?.totalItems ?? 0
  const totalPages = data?.data?.totalPages ?? 1

  const columns: ColumnDef<CampaignFlat>[] = [
    {
      id: "expand",
      header: "",
      size: 32,
      cell: ({ row }) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            dispatch(setExpandedRow(row.original.id))
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          {expandedRowId === row.original.id ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
      ),
    },
    {
      accessorKey: "id",
      header: "ID",
      size: 90,
      cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
          onClick={() => {
            const next = column.getIsSorted() === "asc" ? "desc" : "asc"
            dispatch(setSort({ sortBy: "name", sortOrder: next }))
          }}
        >
          Campaign
          <ArrowUpDown className="size-3" />
        </button>
      ),
      cell: ({ row }) => (
        <div>
          <p className="truncate font-medium text-foreground max-w-[200px]">{row.original.name}</p>
          <p className="truncate text-[11px] text-muted-foreground max-w-[200px]">{row.original.title}</p>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} showDot />,
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }) => (
        <span className="text-xs capitalize text-muted-foreground">{row.original.platform}</span>
      ),
    },
    {
      accessorKey: "totalCount",
      header: "Recipients",
      cell: ({ row }) => (
        <span className="text-sm">{row.original.totalCount.toLocaleString()}</span>
      ),
    },
    {
      id: "deliveryRate",
      header: "Delivery",
      cell: ({ row }) => {
        const rate = row.original.totalCount > 0
          ? Math.round((row.original.sentCount / row.original.totalCount) * 1000) / 10
          : 0
        return (
          <span className={rate > 0 ? "text-sm font-medium" : "text-sm text-muted-foreground"}>
            {rate > 0 ? `${rate}%` : "—"}
          </span>
        )
      },
    },
    {
      accessorKey: "scheduledAt",
      header: "Scheduled",
      cell: ({ row }) => {
        const d = row.original.scheduledAt
        return (
          <span className="text-xs text-muted-foreground">
            {d ? format(new Date(d), "MMM d, HH:mm") : "—"}
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      size: 40,
      cell: ({ row }) => {
        const canCancel = [CampaignStatus.Running, CampaignStatus.Scheduled, CampaignStatus.Draft].includes(row.original.status)
        return (
          <div className="flex items-center gap-1">
            {canCancel && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  cancelMutation.mutate(row.original.id, {
                    onSuccess: () => toast.success(`Campaign ${row.original.id} cancelled`),
                  })
                }}
                title="Cancel campaign"
              >
                <XCircle className="size-3.5 text-muted-foreground" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Campaign History</CardTitle>
            <CardDescription>All campaigns with sorting, filtering and expansion</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => dispatch(resetFilters())}>
            Reset filters
          </Button>
        </div>
        {/* Filters */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Input
            placeholder="Search campaigns…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="h-8 w-48 text-xs"
          />
          <Select
            value={filters.status || "__all__"}
            onValueChange={(v) =>
              dispatch(setFilter({ key: "status", value: (v === "__all__" ? "" : v) as CampaignStatus | "" }))
            }
          >
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {Object.entries(CAMPAIGN_STATUS_CONFIG).map(([v, cfg]) => (
                <SelectItem key={v} value={v}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          expandedRowId={expandedRowId ?? undefined}
          renderSubRow={(row) => <SubRow row={row.original} />}
          getRowId={(row) => row.id}
          onRowClick={(row) => dispatch(setExpandedRow(row.id))}
          emptyState={
            <EmptyState
              title="No campaigns found"
              description="Try adjusting your filters or create a new campaign"
              className="py-12"
            />
          }
          skeletonRows={6}
        />
        <div className="border-t border-border px-5">
          <DataTablePagination
            page={filters.page}
            pageSize={filters.pageSize}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={(p) => dispatch(setPage(p))}
            onPageSizeChange={(s) => dispatch(setFilter({ key: "pageSize", value: s }))}
          />
        </div>
      </CardContent>
    </Card>
  )
}
