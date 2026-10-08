'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSettings, Theme } from '@/lib/useSettings'
import type { Locale, ColorScheme, LayoutStyle, ContentMode } from '@/lib/types'

interface SettingsContextType {
  lang: Locale
  theme: Theme
  colorScheme: ColorScheme
  layout: LayoutStyle
  mode: ContentMode
  aps: string
  nes: string
  rostats: string
  setLang: (lang: Locale) => void
  setTheme: (theme: Theme) => void
  setColorScheme: (colorScheme: ColorScheme) => void
  setLayout: (layout: LayoutStyle) => void
  setMode: (mode: ContentMode) => void
  setAps: (aps: string) => void
  setNes: (nes: string) => void
  setRostats: (rostats: string) => void
  toggleTheme: () => void
  toggleColorScheme: () => void
  toggleLayout: () => void
  toggleMode: () => void
  mounted: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const settings = useSettings()
  
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettingsContext() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider')
  }
  return context
}
