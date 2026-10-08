'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { IndicatorSelect } from '@/components/ui/IndicatorSelect'
import { YearSlider } from '@/components/ui/YearSlider'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { formatStat, scatterGdp, seriesForCountry, useUnstacked } from '@/lib/useUnstacked'
import type { UnstackedRow } from '@/lib/useUnstacked'
import { HorizontalBars, MultiLineChart } from '@/components/charts/GemCharts'
import { ScatterChart } from '@/components/charts/ScatterChart'
import { MapSkeleton } from '@/components/charts/GemMaps'

const WorldChoropleth = dynamic(
  () => import('@/components/charts/GemMaps').then((m) => m.WorldChoropleth),
  { ssr: false, loading: () => <MapSkeleton height={420} /> }
)

const COMPARISON = ['HR', 'PL', 'RO', 'HU']
const ACTIVITY = ['TEA', 'EBO'] as const

export function APSSection() {
  const { t } = useTranslation()
  const { lang, aps, setAps } = useSettingsContext()
  const { file } = useUnstacked('aps', lang)
  const rows = useMemo(() => file?.data || [], [file])
  const meta = file?.meta || {}
  const indicatorLabel = meta[aps] || aps

  const [activity, setActivity] = useState<(typeof ACTIVITY)[number]>('TEA')
  const [year, setYear] = useState<number | null>(null)

  const years = useMemo(() => yearsFor(rows, aps), [rows, aps])
  useEffect(() => {
    if (!years.length) return
    if (year == null || !years.includes(year)) setYear(years[years.length - 1])
  }, [years, year])

  const scatter = useMemo(
    () => scatterGdp(rows, activity).map((p) => ({ ...p, x: p.y, y: p.x })),
    [rows, activity]
  )

  const ranking = useMemo(() => {
    if (year == null) return []
    return rows
      .filter((r) => Number(r.year) === year && isNum(r[aps]))
      .map((r) => ({
        code: String(r.country || ''),
        name: String(r.langcountry || r.country || ''),
        value: Number(r[aps]),
      }))
      .sort((a, b) => b.value - a.value)
  }, [rows, aps, year])
  const rankMax = Math.max(...ranking.map((r) => r.value), 1)

  const peers = COMPARISON.map((code) => ranking.find((r) => r.code === code))
    .filter((r): r is { code: string; name: string; value: number } => Boolean(r))

  const nameOf = (code: string) =>
    String(rows.find((r) => r.country === code)?.langcountry || code)

  return (
    <CollapsibleSection
      id="aps"
      title={t('sections.aps')}
      icon={SectionIcons.globe}
      defaultExpanded={false}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="gem-plate p-6 lg:col-span-4">
            <p className="gem-kicker">{t('aps.title')}</p>
            <h3 className="font-display mt-3 text-2xl font-semibold leading-tight text-[var(--color-text-primary)]">
              {indicatorLabel}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {t('aps.methodology')}
            </p>

            <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm leading-snug text-[var(--color-text-secondary)]">{t('aps.scatter')}</p>
                <div className="flex shrink-0 gap-1.5">
                  {ACTIVITY.map((code) => (
                    <button
                      key={code}
                      type="button"
                      className="gem-pill"
                      aria-pressed={activity === code}
                      onClick={() => setActivity(code)}
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <ScatterChart
                  points={scatter}
                  xLabel={`${meta[activity] || activity} (${activity}, %)`}
                  yLabel={meta.GDP2020 || 'GDP2020'}
                  height={340}
                />
              </div>
            </div>
          </div>

          <div className="gem-plate p-6 lg:col-span-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <IndicatorSelect label="APS indicator" value={aps} options={meta} onChange={setAps} />
              <YearSlider years={years} year={year} onChange={setYear} play />
            </div>
            <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
              <WorldChoropleth rows={rows} year={year} indicator={aps} height={420} />
            </div>
          </div>

          <div className="gem-plate p-6 lg:col-span-3">
            <p className="gem-kicker">
              {aps} {year ?? ''}
            </p>
            <p className="mt-2 text-sm leading-snug text-[var(--color-text-secondary)]">{indicatorLabel}</p>
            <ol className="mt-4 max-h-[28rem] overflow-y-auto pr-2">
              {ranking.map((item, i) => {
                const mine = item.code === 'RO'
                return (
                  <li key={item.code || i} className="border-t border-[var(--color-border-subtle)] py-2 first:border-t-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className={`text-sm ${mine ? 'text-primary font-medium' : 'text-[var(--color-text-secondary)]'}`}>
                        <span className="mr-2 inline-block w-6 tabular text-xs text-[var(--color-text-muted)]">{i + 1}</span>
                        {item.name}
                      </span>
                      <span className={`font-display tabular text-base font-semibold ${mine ? 'text-primary' : 'text-[var(--color-text-primary)]'}`}>
                        {fmt(item.value)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-px bg-[var(--color-bg-tertiary)]">
                      <div className="h-px bg-primary" style={{ width: `${Math.max(0, (item.value / rankMax) * 100)}%` }} />
                    </div>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>

        <div className="gem-plate lg:grid lg:grid-cols-2">
          <div className="border-b border-[var(--color-border-subtle)] p-6 lg:border-b-0 lg:border-r">
            <p className="gem-kicker">{year ?? ''}</p>
            <h3 className="font-display mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
              {indicatorLabel} {t('aps.comparison')}
            </h3>
            <div className="mt-5">
              <HorizontalBars items={peers.map((c) => ({ label: c.name, value: c.value, accent: COMPARISON.indexOf(c.code) }))} />
            </div>
          </div>
          <div className="p-6">
            <p className="gem-kicker">{years.length ? `${years[0]}–${years[years.length - 1]}` : ''}</p>
            <h3 className="font-display mt-2 text-lg font-semibold text-[var(--color-text-primary)]">
              {indicatorLabel} {t('aps.comparison')}
            </h3>
            <div className="mt-5">
              <MultiLineChart
                height={220}
                series={COMPARISON.map((code) => ({
                  id: code,
                  label: nameOf(code),
                  points: seriesForCountry(rows, code, aps),
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

function isNum(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function yearsFor(rows: UnstackedRow[], indicator: string): number[] {
  const set = new Set<number>()
  for (const r of rows) {
    const y = Number(r.year)
    if (Number.isFinite(y) && isNum(r[indicator])) set.add(y)
  }
  return Array.from(set).sort((a, b) => a - b)
}

function fmt(value: number): string {
  return Number.isInteger(value) ? String(value) : formatStat(value, 1)
}
