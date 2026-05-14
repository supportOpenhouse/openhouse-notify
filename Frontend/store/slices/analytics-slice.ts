import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import { AnalyticsFilter, AnalyticsGranularity } from "@/lib/types/analytics"

const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

const initialFilter: AnalyticsFilter = {
  dateRange: {
    from: thirtyDaysAgo.toISOString().split("T")[0],
    to: new Date().toISOString().split("T")[0],
  },
  platform: [],
  campaignType: [],
  granularity: "daily",
}

type AnalyticsUiState = {
  filter: AnalyticsFilter
  activeTab: "overview" | "campaigns" | "platform" | "heatmap"
}

const initialState: AnalyticsUiState = {
  filter: initialFilter,
  activeTab: "overview",
}

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    setDateRange(state, action: PayloadAction<{ from: string; to: string }>) {
      state.filter.dateRange = action.payload
    },
    setPlatformFilter(state, action: PayloadAction<string[]>) {
      state.filter.platform = action.payload
    },
    setCampaignTypeFilter(state, action: PayloadAction<string[]>) {
      state.filter.campaignType = action.payload
    },
    setGranularity(state, action: PayloadAction<AnalyticsGranularity>) {
      state.filter.granularity = action.payload
    },
    resetFilter(state) {
      state.filter = initialFilter
    },
    setActiveTab(state, action: PayloadAction<AnalyticsUiState["activeTab"]>) {
      state.activeTab = action.payload
    },
  },
})

export const { setDateRange, setPlatformFilter, setCampaignTypeFilter, setGranularity, resetFilter, setActiveTab } =
  analyticsSlice.actions

export const analyticsReducer = analyticsSlice.reducer
