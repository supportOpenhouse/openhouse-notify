"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  rowCount?: number
  pageIndex?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
  manualPagination?: boolean
  manualSorting?: boolean
  onSortingChange?: (sorting: SortingState) => void
  sorting?: SortingState
  expandedRowId?: string | null
  renderSubRow?: (row: Row<TData>) => React.ReactNode
  getRowId?: (row: TData) => string
  onRowClick?: (row: TData) => void
  emptyState?: React.ReactNode
  skeletonRows?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  rowCount,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  manualPagination = false,
  manualSorting = false,
  onSortingChange,
  sorting: externalSorting,
  expandedRowId,
  renderSubRow,
  getRowId,
  onRowClick,
  emptyState,
  skeletonRows = 8,
}: DataTableProps<TData, TValue>) {
  const [internalSorting, setInternalSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})

  const sorting = externalSorting ?? internalSorting
  const handleSortingChange = onSortingChange ?? setInternalSorting

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: { pageIndex, pageSize },
    },
    getRowId,
    onSortingChange: handleSortingChange as React.Dispatch<React.SetStateAction<SortingState>>,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    manualPagination,
    manualSorting,
    rowCount: rowCount ?? data.length,
  })

  if (isLoading) {
    return (
      <div className="w-full overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((_, i) => (
                <th key={i} className="px-3 py-3">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className="border-b border-border/50">
                {columns.map((_, j) => (
                  <td key={j} className="px-3 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (!isLoading && data.length === 0 && emptyState) {
    return <>{emptyState}</>
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full caption-bottom text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-border/70">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn(
                    "h-10 px-3 text-left align-middle text-xs font-medium uppercase tracking-wide text-muted-foreground",
                    header.column.getCanSort() && "cursor-pointer select-none hover:text-foreground"
                  )}
                  onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <React.Fragment key={row.id}>
              <tr
                className={cn(
                  "border-b border-border/40 transition-colors hover:bg-muted/30",
                  onRowClick && "cursor-pointer",
                  expandedRowId === row.id && "bg-muted/20"
                )}
                onClick={() => onRowClick?.(row.original)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-2.5 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
              {expandedRowId === row.id && renderSubRow && (
                <tr className="border-b border-border/40 bg-muted/10">
                  <td colSpan={columns.length} className="px-3 py-3">
                    {renderSubRow(row)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  )
}
