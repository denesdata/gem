'use client'

import { useSettingsContext } from '@/components/providers/SettingsProvider'

export function ModeToggle() {
  const { mode, toggleMode, mounted } = useSettingsContext()

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg" aria-label="Toggle mode">
        <div className="w-5 h-5" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors flex items-center gap-1"
      aria-label={`Switch to ${mode === 'simple' ? 'expert' : 'simple'} mode`}
      title={mode === 'simple' ? 'Switch to expert mode (all sections)' : 'Switch to simple mode (streamlined)'}
    >
      {mode === 'simple' ? (
        // Simple icon - clean/minimal
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l2 2" />
        </svg>
      ) : (
        // Expert icon - detailed/advanced
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 6v6l4 2" />
          <path d="M12 6v1" strokeWidth="2" />
          <path d="M18 12h-1" strokeWidth="2" />
          <path d="M12 18v-1" strokeWidth="2" />
          <path d="M6 12h1" strokeWidth="2" />
        </svg>
      )}
      <span className="text-xs font-medium hidden 2xl:inline">
        {mode === 'simple' ? 'Simple' : 'Expert'}
      </span>
    </button>
  )
}
