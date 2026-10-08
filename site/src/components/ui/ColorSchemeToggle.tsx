'use client'

import { useSettingsContext } from '@/components/providers/SettingsProvider'

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme, mounted } = useSettingsContext()

  // Render placeholder during SSR
  if (!mounted) {
    return (
      <button className="p-2 rounded-lg" aria-label="Toggle color scheme">
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleColorScheme}
      className="p-2 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors flex items-center gap-1"
      aria-label={`Switch to ${colorScheme === 'colorful' ? 'green' : 'colorful'} color scheme`}
      title={colorScheme === 'colorful' ? 'Switch to green palette' : 'Switch to colorful palette'}
    >
      {colorScheme === 'colorful' ? (
        // Colorful icon - palette with multiple colors
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle cx="6" cy="8" r="3" fill="#FF70BB" />
          <circle cx="12" cy="6" r="3" fill="#ebbc5a" />
          <circle cx="18" cy="8" r="3" fill="#afa2dc" />
          <circle cx="8" cy="14" r="3" fill="#99D9EA" />
          <circle cx="16" cy="14" r="3" fill="#ffa349" />
          <circle cx="12" cy="18" r="3" fill="#7EC844" />
        </svg>
      ) : (
        // Green icon - shades of green
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
          <circle cx="6" cy="8" r="3" fill="#3D8B70" />
          <circle cx="12" cy="6" r="3" fill="#4A9F31" />
          <circle cx="18" cy="8" r="3" fill="#5FA832" />
          <circle cx="8" cy="14" r="3" fill="#7EC844" />
          <circle cx="16" cy="14" r="3" fill="#9AD864" />
          <circle cx="12" cy="18" r="3" fill="#BBF7D0" />
        </svg>
      )}
      <span className="text-xs font-medium hidden 2xl:inline">
        {colorScheme === 'colorful' ? 'Colorful' : 'Green'}
      </span>
    </button>
  )
}
