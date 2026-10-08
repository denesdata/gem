'use client'

import { ReactNode } from 'react'
import { SettingsProvider } from './SettingsProvider'
import { EmbedBridge } from './EmbedBridge'

export function ClientWrapper({ children }: { children: ReactNode }) {
  return (
    <SettingsProvider>
      <EmbedBridge />
      {children}
    </SettingsProvider>
  )
}
