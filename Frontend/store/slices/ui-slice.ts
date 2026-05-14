import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type ToastVariant = "default" | "success" | "error" | "warning" | "info"

type UiToast = {
  id: string
  message: string
  variant: ToastVariant
  duration?: number
}

type UiState = {
  commandPaletteOpen: boolean
  sidebarPinned: boolean
  activeFiltersOpen: boolean
  toasts: UiToast[]
  globalBannerMessage: string | null
  isOffline: boolean
}

const initialState: UiState = {
  commandPaletteOpen: false,
  sidebarPinned: true,
  activeFiltersOpen: false,
  toasts: [],
  globalBannerMessage: null,
  isOffline: false,
}

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    openCommandPalette(state) {
      state.commandPaletteOpen = true
    },
    closeCommandPalette(state) {
      state.commandPaletteOpen = false
    },
    toggleCommandPalette(state) {
      state.commandPaletteOpen = !state.commandPaletteOpen
    },
    setSidebarPinned(state, action: PayloadAction<boolean>) {
      state.sidebarPinned = action.payload
    },
    toggleFiltersPanel(state) {
      state.activeFiltersOpen = !state.activeFiltersOpen
    },
    setFiltersOpen(state, action: PayloadAction<boolean>) {
      state.activeFiltersOpen = action.payload
    },
    pushToast(state, action: PayloadAction<Omit<UiToast, "id">>) {
      state.toasts.push({ ...action.payload, id: Date.now().toString() })
    },
    removeToast(state, action: PayloadAction<string>) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
    setGlobalBanner(state, action: PayloadAction<string | null>) {
      state.globalBannerMessage = action.payload
    },
    setOffline(state, action: PayloadAction<boolean>) {
      state.isOffline = action.payload
    },
  },
})

export const {
  openCommandPalette,
  closeCommandPalette,
  toggleCommandPalette,
  setSidebarPinned,
  toggleFiltersPanel,
  setFiltersOpen,
  pushToast,
  removeToast,
  setGlobalBanner,
  setOffline,
} = uiSlice.actions

export const uiReducer = uiSlice.reducer
