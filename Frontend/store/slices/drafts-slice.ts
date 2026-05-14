import { createSlice, PayloadAction } from "@reduxjs/toolkit"

type CampaignDraft = {
  id: string
  name: string
  currentStep: number
  lastSavedAt: string
  data: Record<string, unknown>
}

type DraftsState = {
  activeDraftId: string | null
  drafts: CampaignDraft[]
  isDirty: boolean
  autoSaveEnabled: boolean
}

const initialState: DraftsState = {
  activeDraftId: null,
  drafts: [],
  isDirty: false,
  autoSaveEnabled: true,
}

const draftsSlice = createSlice({
  name: "drafts",
  initialState,
  reducers: {
    startDraft(state, action: PayloadAction<{ id: string; name: string }>) {
      const draft: CampaignDraft = {
        id: action.payload.id,
        name: action.payload.name,
        currentStep: 0,
        lastSavedAt: new Date().toISOString(),
        data: {},
      }
      state.drafts.push(draft)
      state.activeDraftId = draft.id
      state.isDirty = false
    },
    updateDraftStep(state, action: PayloadAction<{ id: string; step: number; data: Record<string, unknown> }>) {
      const draft = state.drafts.find((d) => d.id === action.payload.id)
      if (draft) {
        draft.currentStep = action.payload.step
        draft.data = { ...draft.data, ...action.payload.data }
        state.isDirty = true
      }
    },
    saveDraft(state, action: PayloadAction<string>) {
      const draft = state.drafts.find((d) => d.id === action.payload)
      if (draft) {
        draft.lastSavedAt = new Date().toISOString()
        state.isDirty = false
      }
    },
    discardDraft(state, action: PayloadAction<string>) {
      state.drafts = state.drafts.filter((d) => d.id !== action.payload)
      if (state.activeDraftId === action.payload) {
        state.activeDraftId = null
      }
      state.isDirty = false
    },
    setActiveDraft(state, action: PayloadAction<string | null>) {
      state.activeDraftId = action.payload
    },
    markDirty(state) {
      state.isDirty = true
    },
    toggleAutoSave(state) {
      state.autoSaveEnabled = !state.autoSaveEnabled
    },
  },
})

export const { startDraft, updateDraftStep, saveDraft, discardDraft, setActiveDraft, markDirty, toggleAutoSave } =
  draftsSlice.actions

export const draftsReducer = draftsSlice.reducer
