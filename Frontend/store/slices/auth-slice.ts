import { createSlice } from '@reduxjs/toolkit'

/**
 * Auth slice — UI-only state.
 * Session truth lives in NextAuth (useSession / auth()).
 * This slice is kept for Redux store compatibility and any
 * auth-related UI flags that don't belong in the session.
 */

type AuthState = {
  isLoggingOut: boolean
}

const initialState: AuthState = {
  isLoggingOut: false,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoggingOut(state) {
      state.isLoggingOut = true
    },
    clearLoggingOut(state) {
      state.isLoggingOut = false
    },
  },
})

export const { setLoggingOut, clearLoggingOut } = authSlice.actions
export const authReducer = authSlice.reducer
