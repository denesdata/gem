'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Locale, ColorScheme, LayoutStyle, ContentMode } from './types'
import { GRAFANA_DEFAULTS } from './types'

export type Theme = 'light' | 'dark'

interface Settings {
  lang: Locale
  theme: Theme
  colorScheme: ColorScheme
  layout: LayoutStyle
  mode: ContentMode
  aps: string
  nes: string
  rostats: string
}

const DEFAULTS: Settings = {
  lang: 'ro',
  theme: 'dark',
  colorScheme: 'colorful',
  layout: 'compact',
  mode: 'simple',
  aps: GRAFANA_DEFAULTS.aps,
  nes: GRAFANA_DEFAULTS.nes,
  rostats: GRAFANA_DEFAULTS.rostats,
}

function getSettingsFromURL(): Settings {
  if (typeof window === 'undefined') {
    return DEFAULTS
  }
  
  const params = new URLSearchParams(window.location.search)
  const langParam = params.get('lang') as Locale | null
  const themeParam = params.get('theme') as Theme | null
  const colorSchemeParam = params.get('colors') as ColorScheme | null
  const layoutParam = params.get('layout') as LayoutStyle | null
  const modeParam = params.get('mode') as ContentMode | null
  const apsParam = params.get('aps') || params.get('var-aps')
  const nesParam = params.get('nes') || params.get('var-nes')
  const rostatsParam = params.get('rostats') || params.get('var-rostats')

  return {
    lang: langParam && ['en', 'ro', 'hu'].includes(langParam) ? langParam : DEFAULTS.lang,
    theme: themeParam && ['light', 'dark'].includes(themeParam) ? themeParam : DEFAULTS.theme,
    colorScheme: colorSchemeParam && ['colorful', 'green'].includes(colorSchemeParam) ? colorSchemeParam : DEFAULTS.colorScheme,
    layout: layoutParam && ['compact', 'airy'].includes(layoutParam) ? layoutParam : DEFAULTS.layout,
    mode: modeParam && ['simple', 'expert'].includes(modeParam) ? modeParam : DEFAULTS.mode,
    aps: apsParam || DEFAULTS.aps,
    nes: nesParam || DEFAULTS.nes,
    rostats: rostatsParam || DEFAULTS.rostats,
  }
}

function updateURL(settings: Settings) {
  const params = new URLSearchParams()
  params.set('lang', settings.lang)
  params.set('theme', settings.theme)
  params.set('colors', settings.colorScheme)
  params.set('layout', settings.layout)
  params.set('mode', settings.mode)
  params.set('aps', settings.aps)
  params.set('nes', settings.nes)
  params.set('rostats', settings.rostats)
  
  const newURL = `${window.location.pathname}?${params.toString()}${window.location.hash}`
  window.history.replaceState({}, '', newURL)
}

// Read settings from URL immediately (not in useEffect)
function getInitialSettings(): Settings {
  if (typeof window === 'undefined') {
    return DEFAULTS
  }
  return getSettingsFromURL()
}

export function useSettings() {
  const [mounted, setMounted] = useState(false)
  // Initialize with URL params immediately to avoid flash of wrong settings
  const [settings, setSettings] = useState<Settings>(getInitialSettings)

  // Set mounted and apply document attributes on mount
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark')
    document.documentElement.setAttribute('data-colors', settings.colorScheme)
    document.documentElement.setAttribute('data-layout', settings.layout)
    document.documentElement.setAttribute('data-mode', settings.mode)
    document.documentElement.lang = settings.lang
    setMounted(true)
  }, [])

  // Update document attributes when settings change
  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', settings.theme === 'dark')
      document.documentElement.setAttribute('data-colors', settings.colorScheme)
      document.documentElement.setAttribute('data-layout', settings.layout)
      document.documentElement.setAttribute('data-mode', settings.mode)
      document.documentElement.lang = settings.lang
    }
  }, [settings.theme, settings.colorScheme, settings.layout, settings.mode, mounted])

  const setLang = useCallback((newLang: Locale) => {
    setSettings(prev => {
      const next = { ...prev, lang: newLang }
      updateURL(next)
      return next
    })
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setSettings(prev => {
      const next = { ...prev, theme: newTheme }
      updateURL(next)
      return next
    })
  }, [])

  const setColorScheme = useCallback((newColorScheme: ColorScheme) => {
    setSettings(prev => {
      const next = { ...prev, colorScheme: newColorScheme }
      updateURL(next)
      return next
    })
  }, [])

  const setLayout = useCallback((newLayout: LayoutStyle) => {
    setSettings(prev => {
      const next = { ...prev, layout: newLayout }
      updateURL(next)
      return next
    })
  }, [])

  const setMode = useCallback((newMode: ContentMode) => {
    setSettings(prev => {
      const next = { ...prev, mode: newMode }
      updateURL(next)
      return next
    })
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(settings.theme === 'light' ? 'dark' : 'light')
  }, [settings.theme, setTheme])

  const toggleColorScheme = useCallback(() => {
    setColorScheme(settings.colorScheme === 'colorful' ? 'green' : 'colorful')
  }, [settings.colorScheme, setColorScheme])

  const toggleLayout = useCallback(() => {
    setLayout(settings.layout === 'compact' ? 'airy' : 'compact')
  }, [settings.layout, setLayout])

  const toggleMode = useCallback(() => {
    setMode(settings.mode === 'simple' ? 'expert' : 'simple')
  }, [settings.mode, setMode])

  const setAps = useCallback((aps: string) => {
    setSettings(prev => {
      const next = { ...prev, aps }
      updateURL(next)
      return next
    })
  }, [])

  const setNes = useCallback((nes: string) => {
    setSettings(prev => {
      const next = { ...prev, nes }
      updateURL(next)
      return next
    })
  }, [])

  const setRostats = useCallback((rostats: string) => {
    setSettings(prev => {
      const next = { ...prev, rostats }
      updateURL(next)
      return next
    })
  }, [])

  return {
    lang: settings.lang,
    theme: settings.theme,
    colorScheme: settings.colorScheme,
    layout: settings.layout,
    mode: settings.mode,
    aps: settings.aps,
    nes: settings.nes,
    rostats: settings.rostats,
    setLang,
    setTheme,
    setColorScheme,
    setLayout,
    setMode,
    setAps,
    setNes,
    setRostats,
    toggleTheme,
    toggleColorScheme,
    toggleLayout,
    toggleMode,
    mounted,
  }
}
