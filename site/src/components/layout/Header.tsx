'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/useTranslation'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ColorSchemeToggle } from '@/components/ui/ColorSchemeToggle'
import { LayoutToggle } from '@/components/ui/LayoutToggle'
import { ModeToggle } from '@/components/ui/ModeToggle'

export function Header() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '#overview', label: t('nav.overview') },
    { href: '#assistant', label: t('sections.assistant') },
    { href: '#funding', label: t('sections.funding') },
    { href: '#legal', label: t('sections.legal') },
    { href: '#aps', label: t('nav.global') },
    { href: '#reports', label: t('nav.reports') },
  ]

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[color-mix(in_srgb,var(--color-bg-primary)_80%,transparent)] border-b border-[var(--color-border-subtle)]">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <GemMark />
          <div className="hidden sm:block min-w-0">
            <div className="font-display font-semibold text-lg leading-tight tracking-tight">
              GEM Romania
            </div>
            <div className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Global Entrepreneurship Monitor
            </div>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-5">
          {links.map((link) => (
            <NavLink key={link.href} href={link.href}>{link.label}</NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-0.5">
          <LanguageSwitcher />
          <div className="hidden sm:flex items-center gap-0.5">
            <div className="w-px h-5 bg-[var(--color-border-subtle)] mx-1" />
            <ModeToggle />
            <LayoutToggle />
            <ColorSchemeToggle />
            <ThemeToggle />
          </div>
          <button
            className="xl:hidden p-2 rounded-lg hover:bg-[var(--color-border-subtle)]"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="xl:hidden border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:text-primary"
              >
                {link.label}
              </a>
            ))}
            <div className="sm:hidden flex items-center gap-1 pt-3 mt-1 border-t border-[var(--color-border-subtle)]">
              <ModeToggle />
              <LayoutToggle />
              <ColorSchemeToggle />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

function GemMark() {
  return (
    <span className="relative flex h-10 w-10 items-center justify-center text-primary" aria-hidden>
      <svg viewBox="0 0 32 32" className="h-10 w-10">
        <rect width="32" height="32" rx="9" fill="currentColor" opacity="0.16" />
        <path d="M16 25V13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 16C10.5 15.5 9 10 11.2 6.2C14.8 8.4 16 12.2 16 16Z" fill="currentColor" />
        <path d="M16 16C21.5 15.5 23 10 20.8 6.2C17.2 8.4 16 12.2 16 16Z" fill="currentColor" opacity="0.55" />
      </svg>
    </span>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-primary transition-colors"
    >
      {children}
    </a>
  )
}
