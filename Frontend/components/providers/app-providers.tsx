'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { Provider } from 'react-redux'
import { SessionProvider } from 'next-auth/react'

import { AuthContextProvider } from '@/contexts/auth-context'
import { queryClient } from '@/lib/query-client'
import { store } from '@/store'
import { Toaster } from '@/components/ui/sonner'
import { CommandPalette } from '@/components/shared/command-palette'

type AppProvidersProps = {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <AuthContextProvider>
          <QueryClientProvider client={queryClient}>
            {children}
            <CommandPalette />
            <Toaster position="top-right" richColors />
          </QueryClientProvider>
        </AuthContextProvider>
      </Provider>
    </SessionProvider>
  )
}
