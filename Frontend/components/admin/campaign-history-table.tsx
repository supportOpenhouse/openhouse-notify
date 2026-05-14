"use client"

import * as React from "react"
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCampaignHistory } from "@/hooks/use-notification-campaigns"
import { CampaignFlat, CampaignStatus } from "@/lib/types/notification"
import { Skeleton } from "@/components/ui/skeleton"

const STATUS_VARIANT: Record<CampaignStatus, "default" | "secondary" | "success" | "warning"> = {
  [CampaignStatus.Completed]: "success",
  [CampaignStatus.Scheduled]: "warning",
  [CampaignStatus.Draft]:     "secondary",
  [CampaignStatus.Running]:   "default",
  [CampaignStatus.Paused]:    "warning",
  [CampaignStatus.Failed]:    "secondary",
  [CampaignStatus.Cancelled]: "secondary",
}

const columns: ColumnDef<CampaignFlat>[] = [
  { accessorKey: "id", header: "Campaign ID" },
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.original.status
      return <Badge variant={STATUS_VARIANT[value] ?? "secondary"}>{value}</Badge>
    },
  },
  { accessorKey: "totalCount", header: "Recipients" },
  { accessorKey: "sentCount", header: "Sent" },
  { accessorKey: "failedCount", header: "Failed" },
]

export function CampaignHistoryTable() {
  const { data, isLoading } = useCampaignHistory()
  const items = data?.data?.items ?? []

  const table = useReactTable({ data: items, columns, getCoreRowModel: getCoreRowModel() })

  if (isLoading) {
    return (
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Campaign History</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Campaign History</CardTitle>
        <CardDescription>TanStack Table with reusable UI blocks.</CardDescription>
      </CardHeader>
      <CardContent className="max-w-full overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs sm:min-w-[620px] sm:text-sm">
          <thead className="border-b border-border/70 text-xs uppercase tracking-wide text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-2 py-2 font-medium">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b border-border/50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-2 py-2">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}
