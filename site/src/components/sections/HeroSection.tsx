'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { formatStat, latestRomania, latestYear, num, useUnstacked } from '@/lib/useUnstacked'
import { publicUrl } from '@/lib/basePath'
import { panelUrl } from '@/lib/panelHost'
import linkedinPosts from '../../../public/linkedin-posts.json'

interface NewsItem {
  date: string
  media: string
  desc: string
  lang: string
  link: string
}

interface Figure {
  code: string
  label: string
  value: string
}

export function HeroSection() {
  const { t } = useTranslation()
  const { lang, theme } = useSettingsContext()
  const { file: aps } = useUnstacked('aps', lang)
  const dataYear = aps ? latestYear(aps.data) : null
  const apsRO = aps ? latestRomania(aps.data) : null

  const figures: Figure[] = [
    { code: 'TEA', label: t('stats.tea'), value: num(apsRO, 'TEA') },
    { code: 'EBO', label: t('stats.ebo'), value: num(apsRO, 'EBO') },
    { code: 'Intent', label: t('stats.intent'), value: num(apsRO, 'Intent') },
    { code: 'Opport', label: t('attitudes.opportunities'), value: num(apsRO, 'Opport') },
  ]
    .filter((item) => item.value != null)
    .map((item) => ({ ...item, value: `${formatStat(item.value, 1)}%` }))

  return (
    <section className="relative">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-6 border-b border-[var(--color-border-subtle)] pb-6 md:mb-14">
          <div className="flex items-center gap-6 md:gap-10">
            <a
              href="https://www.gemconsortium.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src="https://www.gemconsortium.org/images/new-logo-white.png"
                alt="Global Entrepreneurship Monitor"
                className="h-12 md:h-16 w-auto dark:brightness-100 dark:opacity-100 brightness-0 opacity-60"
              />
            </a>
            <span className="h-10 w-px bg-[var(--color-border-subtle)] md:h-14" aria-hidden />
            <a
              href="https://econ.ubbcluj.ro/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-opacity hover:opacity-80"
            >
              <img
                src={publicUrl(theme === 'dark' ? '/brand/ubb-fsega-mark-light.png' : '/brand/ubb-fsega.png')}
                alt="UBB FSEGA"
                className="h-14 w-auto md:h-20"
              />
            </a>
          </div>

          <div className="hidden md:block">
            <Clock />
          </div>
        </div>

        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="gem-kicker mb-6">
              <span className="tabular text-primary">{dataYear ?? '—'}</span> {t('hero.badge')}
            </p>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight mb-6">
              {t('hero.title')}{' '}
              <span className="text-primary italic">{t('hero.titleHighlight')}</span>
            </h1>

            <p className="text-lg md:text-xl text-[var(--color-text-secondary)] mb-8 max-w-2xl leading-relaxed">
              {t('hero.description')}
            </p>

            <div className="flex flex-wrap gap-3">
              <a
                href="#assistant"
                className="btn-gem inline-flex items-center gap-2 px-6 py-3 rounded-full transition-colors"
              >
                {t('sections.assistant')}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a
                href="#reports"
                className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--color-border-default)] rounded-full font-medium hover:border-primary hover:text-primary transition-colors"
              >
                {t('hero.ctaSecondary')}
              </a>
            </div>
          </div>

          <div className="lg:col-span-4">
            <div className="gem-plate p-6 md:p-8">
              <RotatingFigure figures={figures} year={dataYear} />
              <dl className="mt-8 grid grid-cols-2 border-t border-[var(--color-border-subtle)]">
                <HeroStat value="42" label={t('stats.counties')} />
                <HeroStat value="17+" label={t('stats.yearsOfData')} edge />
                <HeroStat value="50+" label={t('stats.indicators')} top />
                <HeroStat value="3" label={t('stats.languages')} edge top />
              </dl>
            </div>
          </div>
        </div>

        <PressMarquee lang={lang} label={t('reports.mediaTitle')} />
      </div>
    </section>
  )
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

function RotatingFigure({ figures, year }: { figures: Figure[]; year: number | null }) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const count = figures.length

  useEffect(() => {
    if (reduced || count < 2) return
    const id = window.setInterval(() => setIndex((prev) => (prev + 1) % count), 4500)
    return () => window.clearInterval(id)
  }, [reduced, count])

  if (!count) return <p className="gem-kicker">APS {year ?? ''}</p>
  const active = index % count

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <p className="gem-kicker">
          APS <span className="tabular">{year ?? ''}</span>
        </p>
        <div className="flex gap-1.5" aria-hidden>
          {figures.map((item, i) => (
            <span
              key={item.code}
              className={`h-px w-5 transition-colors duration-700 motion-reduce:transition-none ${
                i === active ? 'bg-primary' : 'bg-[var(--color-border-default)]'
              }`}
            />
          ))}
        </div>
      </div>
      <div className="mt-5 grid">
        {figures.map((item, i) => (
          <div
            key={item.code}
            style={{ gridArea: '1 / 1' }}
            aria-hidden={i !== active}
            className={`transition-opacity duration-700 motion-reduce:transition-none ${
              i === active ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{item.code}</p>
            <p className="font-display mt-2 text-5xl font-semibold leading-none tracking-[-0.03em] tabular text-primary">
              {item.value}
            </p>
            <p className="mt-3 max-w-[32ch] text-sm leading-relaxed text-[var(--color-text-secondary)]">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PressMarquee({ lang, label }: { lang: string; label: string }) {
  const [newsCatalogue, setNewsCatalogue] = useState<NewsItem[]>([])
  useEffect(() => {
    fetch(panelUrl('news.json'))
      .then((res) => (res.ok ? res.json() : []))
      .then((rows) => setNewsCatalogue(Array.isArray(rows) ? rows : []))
      .catch(() => setNewsCatalogue([]))
  }, [])

  const { loop, unique } = useMemo(() => {
    const wanted = lang.toUpperCase()
    const press = newsCatalogue
      .filter((row) => String(row.lang || '').toUpperCase() === wanted && row.link && row.desc)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 12)
    const linkedin = (linkedinPosts as NewsItem[])
      .filter((row) => row.link && row.desc)
      .map((row) => ({ ...row, lang: wanted, media: 'LinkedIn' }))
    const mine = [...linkedin, ...press].sort((a, b) => b.date.localeCompare(a.date))
    if (!mine.length) return { loop: [] as NewsItem[], unique: 0 }
    const run: NewsItem[] = []
    while (run.length < 8) run.push(...mine)
    return { loop: [...run, ...run], unique: mine.length }
  }, [lang, newsCatalogue])

  if (!loop.length) return null
  const half = loop.length / 2

  return (
    <div className="mt-12 flex items-center gap-6 border-y border-[var(--color-border-subtle)] py-3">
      <p className="gem-kicker hidden shrink-0 sm:block">{label}</p>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="gem-marquee" style={{ gap: 0, animationDuration: `${half * 6}s` }}>
          {loop.map((item, i) => {
            const repeat = i >= unique
            return (
              <a
                key={`${item.link}-${i}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                aria-hidden={repeat || undefined}
                tabIndex={repeat ? -1 : undefined}
                className="flex shrink-0 items-baseline gap-3 pr-10 text-sm text-[var(--color-text-secondary)] hover:text-primary"
              >
                <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{item.media}</span>
                <span className="max-w-[46ch] truncate">{item.desc}</span>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Clock() {
  return (
    <div className="text-right">
      <div className="font-display text-2xl tabular text-[var(--color-text-primary)]">
        <ClockDisplay />
      </div>
      <div className="gem-kicker mt-1">Cluj-Napoca, Romania</div>
    </div>
  )
}

function ClockDisplay() {
  const [time, setTime] = useState<string>('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/Bucharest',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
      setTime(timeStr)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return <span>{time || '--:--:--'}</span>
}

function HeroStat({ value, label, edge, top }: { value: string; label: string; edge?: boolean; top?: boolean }) {
  return (
    <div
      className={`flex flex-col-reverse py-4 ${edge ? 'border-l border-[var(--color-border-subtle)] pl-4' : 'pr-4'} ${
        top ? 'border-t border-[var(--color-border-subtle)]' : ''
      }`}
    >
      <dt className="mt-1 text-xs text-[var(--color-text-muted)]">{label}</dt>
      <dd className="font-display text-2xl font-semibold tabular text-[var(--color-text-primary)]">{value}</dd>
    </div>
  )
}
