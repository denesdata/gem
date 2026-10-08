'use client'

interface IndicatorSelectProps {
  label: string
  value: string
  options: Record<string, string>
  onChange: (value: string) => void
}

export function IndicatorSelect({ label, value, options, onChange }: IndicatorSelectProps) {
  const entries = Object.entries(options)
  if (entries.length === 0) return null

  return (
    <label className="block">
      <span className="block text-xs text-[var(--color-text-muted)] mb-2 uppercase tracking-wider">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] focus:border-primary focus:outline-none"
      >
        {entries.map(([code, name]) => (
          <option key={code} value={code}>
            {name} ({code})
          </option>
        ))}
      </select>
    </label>
  )
}
