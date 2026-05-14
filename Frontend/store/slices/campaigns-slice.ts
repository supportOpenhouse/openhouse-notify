import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { CampaignStatus } from "@/lib/types/notification"

type CampaignFilter = {
  search: string
  status: CampaignStatus | ""
  platform: string
  dateFrom: string
  dateTo: string
  sortBy: string
  sortOrder: "asc" | "desc"
  page: number
  pageSize: number
}

type CampaignUiState = {
  filters: CampaignFilter
  selectedIds: string[]
  expandedRowId: string | null
  viewMode: "table" | "card"
}

const defaultFilters: CampaignFilter = {
  search: "",
  status: "",
  platform: "",
  dateFrom: "",
  dateTo: "",
  sortBy: "createdAt",
  sortOrder: "desc",
  page: 1,
  pageSize: 10,
}

const initialState: CampaignUiState = {
  filters: defaultFilters,
  selectedIds: [],
  expandedRowId: null,
  viewMode: "table",
}

const campaignsSlice = createSlice({
  name: "campaigns",
  initialState,
  reducers: {
    setFilter<K extends keyof CampaignFilter>(
      state: CampaignUiState,
      action: PayloadAction<{ key: K; value: CampaignFilter[K] }>
    ) {
      state.filters[action.payload.key] = action.payload.value
      if (action.payload.key !== "page") {
        state.filters.page = 1
      }
    },
    resetFilters(state) {
      state.filters = defaultFilters
    },
    toggleRowSelection(state, action: PayloadAction<string>) {
      const idx = state.selectedIds.indexOf(action.payload)
      if (idx >= 0) {
        state.selectedIds.splice(idx, 1)
      } else {
        state.selectedIds.push(action.payload)
      }
    },
    selectAllRows(state, action: PayloadAction<string[]>) {
      state.selectedIds = action.payload
    },
    clearSelection(state) {
      state.selectedIds = []
    },
    setExpandedRow(state, action: PayloadAction<string | null>) {
      state.expandedRowId = state.expandedRowId === action.payload ? null : action.payload
    },
    setViewMode(state, action: PayloadAction<"table" | "card">) {
      state.viewMode = action.payload
    },
    setPage(state, action: PayloadAction<number>) {
      state.filters.page = action.payload
    },
    setSort(state, action: PayloadAction<{ sortBy: string; sortOrder: "asc" | "desc" }>) {
      state.filters.sortBy = action.payload.sortBy
      state.filters.sortOrder = action.payload.sortOrder
      state.filters.page = 1
    },
  },
})

export const {
  setFilter,
  resetFilters,
  toggleRowSelection,
  selectAllRows,
  clearSelection,
  setExpandedRow,
  setViewMode,
  setPage,
  setSort,
} = campaignsSlice.actions

export const campaignsReducer = campaignsSlice.reducer
