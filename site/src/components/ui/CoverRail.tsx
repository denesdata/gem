'use client'

import { ReactNode, useRef } from 'react'

export function CoverRail({ children }: { children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null)

  const scrollByCard = (dir: number) => {
    const el = rail.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-rail-card]')
    const step = card ? card.offsetWidth + 16 : Math.max(200, el.clientWidth * 0.7)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <div className="relative md:px-5">
      <button
        type="button"
        aria-label="Previous"
        onClick={() => scrollByCard(-1)}
        className="absolute left-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] shadow-sm md:flex"
      >
        <Chevron dir="left" />
      </button>
      <div ref={rail} className="gem-rail">
        {children}
      </div>
      <button
        type="button"
        aria-label="Next"
        onClick={() => scrollByCard(1)}
        className="absolute right-0 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] shadow-sm md:flex"
      >
        <Chevron dir="right" />
      </button>
    </div>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={dir === 'left' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
      />
    </svg>
  )
}
