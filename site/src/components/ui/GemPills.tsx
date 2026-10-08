'use client'

interface GemPillsProps {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}

export function GemPills({ options, value, onChange }: GemPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className="gem-pill"
          aria-pressed={value === opt.id}
          onClick={() => onChange(opt.id)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
