'use client'

import { useSettingsContext } from '@/components/providers/SettingsProvider'

export function LayoutToggle() {
  const { layout, toggleLayout, mounted } = useSettingsContext()

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg" aria-label="Toggle layout">
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleLayout}
      className="p-2 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors flex items-center gap-1"
      aria-label={`Switch to ${layout === 'compact' ? 'airy' : 'compact'} layout`}
      title={layout === 'compact' ? 'Switch to airy layout' : 'Switch to compact layout'}
    >
      {layout === 'compact' ? (
        // Compact icon - dense grid
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ) : (
        // Airy icon - spaced elements
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="4" y="4" width="5" height="5" rx="1" />
          <rect x="15" y="4" width="5" height="5" rx="1" />
          <rect x="4" y="15" width="5" height="5" rx="1" />
          <rect x="15" y="15" width="5" height="5" rx="1" />
        </svg>
      )}
      <span className="text-xs font-medium hidden 2xl:inline">
        {layout === 'compact' ? 'Compact' : 'Airy'}
      </span>
    </button>
  )
}
