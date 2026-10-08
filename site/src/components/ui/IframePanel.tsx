'use client'

import { useState } from 'react'
import { useSettingsContext } from '@/components/providers/SettingsProvider'

interface IframePanelProps {
  /** Base URL for the iframe (without lang/theme params) */
  baseUrl: string
  /** Title for accessibility */
  title: string
  /** Height of the iframe */
  height?: string | number
  /** Whether to pass lang param */
  passLang?: boolean
  /** Whether to pass theme param */
  passTheme?: boolean
  /** Whether to pass color scheme param */
  passColors?: boolean
  /** URL param style: 'hash' for #lang&theme or 'query' for ?lang=X&theme=Y */
  paramStyle?: 'hash' | 'query'
  /** Additional query params */
  extraParams?: Record<string, string>
  /** Custom class name */
  className?: string
}

export function IframePanel({
  baseUrl,
  title,
  height = 400,
  passLang = true,
  passTheme = true,
  passColors = true,
  paramStyle = 'hash',
  extraParams = {},
  className = '',
}: IframePanelProps) {
  const { lang, theme, colorScheme } = useSettingsContext()
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Build the full URL with lang/theme/colors params
  const buildUrl = () => {
    let url = baseUrl

    if (paramStyle === 'hash') {
      // Hash style: baseUrl#lang&theme&colors
      const hashParts: string[] = []
      if (passLang) hashParts.push(lang.toUpperCase())
      if (passTheme) hashParts.push(theme)
      if (passColors) hashParts.push(colorScheme)
      
      // Add extra params to hash
      Object.entries(extraParams).forEach(([key, value]) => {
        hashParts.push(value)
      })

      if (hashParts.length > 0) {
        url += '#' + hashParts.join('&')
      }
    } else {
      // Query style: baseUrl?lang=X&theme=Y&colors=Z
      const params = new URLSearchParams()
      if (passLang) params.set('lang', lang.toUpperCase())
      if (passTheme) params.set('theme', theme)
      if (passColors) params.set('colors', colorScheme)
      
      // Add extra params
      Object.entries(extraParams).forEach(([key, value]) => {
        params.set(key, value)
      })

      const queryString = params.toString()
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString
      }
    }

    return url
  }

  const iframeUrl = buildUrl()
  
  // Include extraParams so Grafana-style $aps/$nes/$rostats changes remount the panel
  const extraKey = Object.values(extraParams).join('-')
  const iframeKey = `${baseUrl}-${lang}-${theme}-${colorScheme}-${extraKey}`

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {/* Loading state */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-card)] rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-[var(--color-text-muted)]">Loading...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-card)] rounded-lg">
          <div className="flex flex-col items-center gap-3 text-center p-4">
            <svg className="w-10 h-10 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-[var(--color-text-muted)]">Failed to load content</span>
            <button
              onClick={() => {
                setHasError(false)
                setIsLoading(true)
              }}
              className="text-sm text-primary text-primary-hover"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Iframe - key forces remount on settings change */}
      <iframe
        key={iframeKey}
        src={iframeUrl}
        title={title}
        className={`w-full h-full rounded-lg border-0 ${isLoading || hasError ? 'invisible' : 'visible'}`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        allow="fullscreen"
        loading="lazy"
      />
    </div>
  )
}
