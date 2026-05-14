import { configureStore } from "@reduxjs/toolkit"

import { authReducer } from "@/store/slices/auth-slice"
import { uiReducer } from "@/store/slices/ui-slice"
import { campaignsReducer } from "@/store/slices/campaigns-slice"
import { draftsReducer } from "@/store/slices/drafts-slice"
import { analyticsReducer } from "@/store/slices/analytics-slice"

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    campaigns: campaignsReducer,
    drafts: draftsReducer,
    analytics: analyticsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
