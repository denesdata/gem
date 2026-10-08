'use client'

import { useEffect, useMemo, useState } from 'react'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { CoverRail } from '@/components/ui/CoverRail'
import { GemPills } from '@/components/ui/GemPills'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import type { Locale } from '@/lib/types'
import { panelUrl } from '@/lib/panelHost'

interface ReportItem {
  year: number
  sort: number
  kind: 'globalreport' | 'nationalreport' | 'specialreport' | string
  featured?: boolean
  href: string
  img: string
  title: Partial<Record<'EN' | 'RO' | 'HU', string>>
}

interface NewsItem {
  date: string
  type: string
  media: string
  desc: string
  lang: string
  link: string
}

const KINDS = ['all', 'globalreport', 'nationalreport', 'specialreport'] as const

function newsFor(lang: Locale, rows: NewsItem[]): NewsItem[] {
  const wanted = lang.toUpperCase()
  const mine = rows.filter((row) => String(row.lang || '').toUpperCase() === wanted)
  return mine.length ? mine : rows
}

export function ReportsSection() {
  const { t, lang } = useTranslation()
  const { lang: settingsLang } = useSettingsContext()
  const locale = (settingsLang || lang) as Locale
  const titleLang = locale.toUpperCase() as 'EN' | 'RO' | 'HU'
  const [reports, setReports] = useState<ReportItem[]>([])
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [kind, setKind] = useState<(typeof KINDS)[number]>('all')

  useEffect(() => {
    fetch(panelUrl('reports.json'))
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: ReportItem[]) => setReports(Array.isArray(rows) ? rows : []))
      .catch(() => setReports([]))
  }, [])

  useEffect(() => {
    fetch(panelUrl('news.json'))
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: NewsItem[]) => {
        setNewsItems(newsFor(locale, Array.isArray(rows) ? rows : []))
      })
      .catch(() => setNewsItems([]))
  }, [locale])

  const visible = useMemo(
    () => (kind === 'all' ? reports : reports.filter((item) => item.kind === kind)),
    [kind, reports],
  )

  const pills = KINDS.map((id) => ({
    id,
    label: t(id === 'all' ? 'reports.filterAll' : `reports.${id}`),
  }))

  return (
    <CollapsibleSection
      id="reports"
      title={t('sections.reports')}
      icon={SectionIcons.news}
      defaultExpanded={false}
    >
      <div className="space-y-8">
        <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">{t('sections.reportsDesc')}</p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                {t('reports.title')}
              </h3>
              <GemPills options={pills} value={kind} onChange={(id) => setKind(id as typeof kind)} />
            </div>
            <div>
              <CoverRail>
                {visible.map((item) => {
                  const title = item.title?.[titleLang] || item.title?.EN || item.title?.RO || ''
                return (
                  <a
                    key={`${item.sort}-${item.kind}-${item.href}`}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-rail-card
                    className={`gem-rail-card group overflow-hidden rounded-2xl border bg-[var(--color-bg-card)] transition-colors ${
                      item.featured
                        ? 'border-[var(--color-primary)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-accent)]'
                    }`}
                  >
                    <div className="gem-cover relative overflow-hidden">
                      {item.img ? (
                        <img
                          src={item.img}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                        />
                      ) : null}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-3">
                        <div className="tabular text-2xl font-semibold text-white">{item.year}</div>
                      </div>
                      <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                        {t(`reports.${item.kind}`)}
                      </span>
                    </div>
                    <div className="space-y-2 p-3.5">
                      <h4 className="font-display text-[0.95rem] font-semibold leading-snug text-[var(--color-text-primary)] line-clamp-3">
                        {title}
                      </h4>
                      <span className="inline-flex text-xs font-medium text-primary">{t('reports.open')}</span>
                    </div>
                  </a>
                )
              })}
              </CoverRail>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                {t('reports.mediaTitle')}
              </h3>
              <span className="gem-kicker tabular">{newsItems.length}</span>
            </div>
            <div className="gem-plate max-h-[540px] overflow-y-auto px-5">
              {newsItems.map((item, index) => {
                const { year, dayMonth } = splitNewsDate(item.date, locale)
                return (
                  <article
                    key={`${item.date}-${index}`}
                    className="gem-news-item grid grid-cols-[3.25rem_1fr] items-baseline gap-4 py-4"
                  >
                    <time className="flex flex-col" dateTime={item.date}>
                      <span className="font-display text-lg font-semibold leading-none tabular text-primary">{year}</span>
                      <span className="mt-1 text-[11px] tabular text-[var(--color-text-muted)]">{dayMonth}</span>
                    </time>
                    <div className="min-w-0">
                      <p className="mb-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{item.media}</p>
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3 hover:text-primary"
                        >
                          {item.desc}
                        </a>
                      ) : (
                        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] line-clamp-3">{item.desc}</p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

function splitNewsDate(iso: string, lang: Locale): { year: string; dayMonth: string } {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return { year: iso, dayMonth: '' }
  const locale = lang === 'hu' ? 'hu-HU' : lang === 'ro' ? 'ro-RO' : 'en-GB'
  return {
    year: String(date.getFullYear()),
    dayMonth: new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(date),
  }
}
