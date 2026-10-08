'use client'

import { useEffect, useMemo, useState } from 'react'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { GemPills } from '@/components/ui/GemPills'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import type { Locale } from '@/lib/types'
import { panelUrl } from '@/lib/panelHost'

interface UpcomingItem {
  date: string
  cat: string
  close: string
  desc: string
  link: string
}

const CAT_ORDER = [
  'Start-up_op_fin',
  'IT_op_fin',
  'Productie_op_fin',
  'Agricultura_op_fin',
  'Arta_and_culture_op_fin',
  'Servicii_op_fin',
  'Comert_op_fin',
  'Turism_op_fin',
  'Constructii_op_fin',
  'Alte_op_fin',
  'Toate_op_fin',
]

export function FundingSection() {
  const { t } = useTranslation()
  const { lang } = useSettingsContext()
  const [deadlines, setDeadlines] = useState<UpcomingItem[]>([])
  const [cat, setCat] = useState('all')

  useEffect(() => {
    fetch(panelUrl('upcoming.json'))
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: UpcomingItem[]) => setDeadlines(Array.isArray(rows) ? rows : []))
      .catch(() => setDeadlines([]))
  }, [])

  const presentCats = useMemo(() => {
    const found = new Set<string>()
    deadlines.forEach((item) => {
      item.cat
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean)
        .forEach((token) => found.add(token))
    })
    return CAT_ORDER.filter((id) => found.has(id))
  }, [deadlines])

  const pills = [
    { id: 'all', label: t('funding.filterAll') },
    ...presentCats.map((id) => ({ id, label: t(`funding.cats.${id}`) })),
  ]

  const filtered = useMemo(() => {
    const rows = [...deadlines].sort((a, b) => a.date.localeCompare(b.date))
    if (cat === 'all') return rows
    return rows.filter((item) =>
      item.cat
        .split(',')
        .map((token) => token.trim())
        .includes(cat),
    )
  }, [cat, deadlines])

  const upcomingPreview = filtered.slice(0, 8)

  return (
    <CollapsibleSection
      id="funding"
      title={t('sections.funding')}
      icon={SectionIcons.funding}
      defaultExpanded={false}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <div className="gem-plate">
            <div className="p-6">
              <p className="gem-kicker">{t('sections.funding')}</p>
              <h3 className="font-display mt-2 text-xl font-semibold leading-snug tracking-tight text-[var(--color-text-primary)]">
                {t('sections.fundingDesc')}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{t('funding.infoText')}</p>
              <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{t('funding.detailText')}</p>
            </div>

            <div className="border-t border-[var(--color-border-subtle)] p-6">
              <p className="gem-kicker mb-3">{t('funding.upcomingDeadlines')}</p>
              <ol className="border-t border-[var(--color-border-subtle)]">
                {upcomingPreview.map((item) => (
                  <DeadlineItem
                    key={`${item.date}-${item.desc}`}
                    date={item.date}
                    title={item.desc}
                    href={item.link}
                    lang={lang}
                  />
                ))}
              </ol>
            </div>

            <div className="border-t border-[var(--color-border-subtle)] p-6">
              <p className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t('funding.exitReason')}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              {t('funding.calls')}
            </h3>
            <GemPills options={pills} value={cat} onChange={setCat} />
          </div>
          {filtered.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">{t('funding.empty')}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => {
                const className =
                  'gem-plate group flex flex-col p-5 transition-colors hover:border-[var(--color-border-accent)]'
                const body = (
                  <>
                    <div className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-3">
                      <time className="font-display text-base font-semibold tabular text-primary" dateTime={item.date}>
                        {formatNewsDate(item.date, lang)}
                      </time>
                      <span className="gem-kicker">{daysLeftLabel(item.date, t)}</span>
                    </div>
                    <h4 className="font-display mt-3 text-[1.05rem] font-semibold leading-snug text-[var(--color-text-primary)] group-hover:text-primary">
                      {item.desc}
                    </h4>
                    <p className="mt-auto pt-4 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
                      {item.cat
                        .split(',')
                        .map((token) => token.trim())
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((token) => t(`funding.cats.${token}`))
                        .join(' · ')}
                    </p>
                  </>
                )
                return item.link ? (
                  <a
                    key={`${item.date}-${item.desc}`}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={className}
                  >
                    {body}
                  </a>
                ) : (
                  <div key={`${item.date}-${item.desc}`} className={className}>
                    {body}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </CollapsibleSection>
  )
}

function DeadlineItem({ date, title, href, lang }: { date: string; title: string; href?: string; lang: Locale }) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border-subtle)] py-2.5 last:border-b-0">
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] leading-snug text-[var(--color-text-secondary)] hover:text-primary"
        >
          {title}
        </a>
      ) : (
        <span className="text-[13px] leading-snug text-[var(--color-text-secondary)]">{title}</span>
      )}
      <time className="whitespace-nowrap text-[11px] tabular text-primary" dateTime={date}>
        {formatNewsDate(date, lang)}
      </time>
    </li>
  )
}

function formatNewsDate(iso: string, lang: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const locale = lang === 'hu' ? 'hu-HU' : lang === 'ro' ? 'ro-RO' : 'en-GB'
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

function daysLeftLabel(iso: string, t: (key: string) => string): string {
  const target = new Date(iso)
  if (Number.isNaN(target.getTime())) return ''
  const start = new Date()
  target.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  const days = Math.round((target.getTime() - start.getTime()) / 86400000)
  if (days < 0) return t('funding.closed')
  if (days === 0) return t('funding.today')
  if (days === 1) return t('funding.inOneDay')
  return t('funding.inDays').replace('{n}', String(days))
}
