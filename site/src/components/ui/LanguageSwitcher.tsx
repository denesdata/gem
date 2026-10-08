'use client'

import { useState } from 'react'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import type { Locale } from '@/lib/types'

const languages: { code: Locale; label: string; name: string }[] = [
  { code: 'ro', label: 'RO', name: 'Romana' },
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'hu', label: 'HU', name: 'Magyar' },
]

export function LanguageSwitcher() {
  const { lang, setLang } = useSettingsContext()
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (code: Locale) => {
    setLang(code)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-[var(--color-border-subtle)] transition-colors text-sm font-medium"
      >
        {languages.find(l => l.code === lang)?.label}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 py-2 w-32 bg-[var(--color-bg-card)] rounded-lg shadow-lg border border-[var(--color-border-subtle)] z-50">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleChange(language.code)}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-[var(--color-border-subtle)] transition-colors ${
                  lang === language.code ? 'text-primary font-medium' : ''
                }`}
              >
                <span className="font-medium">{language.label}</span>
                <span className="text-[var(--color-text-muted)] ml-2">{language.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
