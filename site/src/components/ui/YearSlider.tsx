'use client'

import { useEffect, useRef, useState } from 'react'

export function YearSlider({
  years,
  year,
  onChange,
  play = false,
}: {
  years: number[]
  year: number | null
  onChange: (year: number) => void
  play?: boolean
}) {
  const [playing, setPlaying] = useState(false)
  const yearsRef = useRef(years)
  const yearRef = useRef(year)
  const onChangeRef = useRef(onChange)
  yearsRef.current = years
  yearRef.current = year
  onChangeRef.current = onChange

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      const list = yearsRef.current
      const current = yearRef.current
      if (list.length < 2 || current == null) return
      const index = list.indexOf(current)
      const next = list[index < 0 ? 0 : (index + 1) % list.length]
      onChangeRef.current(next)
    }, 800)
    return () => window.clearInterval(id)
  }, [playing])

  if (!years.length || year == null) return null
  const min = years[0]
  const max = years[years.length - 1]
  if (min === max) {
    return <span className="font-display text-lg tabular text-[var(--color-text-primary)]">{year}</span>
  }

  const snap = (next: number) => {
    return years.reduce((best, candidate) =>
      Math.abs(candidate - next) < Math.abs(best - next) ? candidate : best
    )
  }

  return (
    <div className="flex min-w-[12rem] items-center gap-3">
      {play && (
        <button
          type="button"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-primary"
          aria-pressed={playing}
          aria-label={playing ? 'Pause' : 'Play'}
          onClick={() => setPlaying((value) => !value)}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
      )}
      <span className="font-display w-12 text-lg tabular text-[var(--color-text-primary)]">{year}</span>
      <input
        className="gem-year"
        type="range"
        min={min}
        max={max}
        step={1}
        value={year}
        aria-label={String(year)}
        onChange={(event) => onChange(snap(Number(event.target.value)))}
      />
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path d="M2 1.2v7.6L8.5 5 2 1.2z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path d="M2 1h2v8H2zM6 1h2v8H6z" fill="currentColor" />
    </svg>
  )
}
