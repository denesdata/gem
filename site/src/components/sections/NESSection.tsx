'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { IndicatorSelect } from '@/components/ui/IndicatorSelect'
import { YearSlider } from '@/components/ui/YearSlider'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { formatStat, num, useUnstacked } from '@/lib/useUnstacked'
import type { UnstackedRow } from '@/lib/useUnstacked'
import { useGemColors } from '@/lib/useGemColors'
import { MapSkeleton } from '@/components/charts/GemMaps'

const WorldChoropleth = dynamic(
  () => import('@/components/charts/GemMaps').then((m) => m.WorldChoropleth),
  { ssr: false, loading: () => <MapSkeleton height={400} /> }
)

const AXES = ['EFC1a', 'EFC2a', 'EFC3', 'EFC4a', 'EFC5', 'EFC6', 'EFC7a', 'EFC8', 'EFC9']
const COUNTRIES = ['RO', 'PL', 'HR', 'HU']
const SCALE_MAX = 10

interface RadarSeries {
  code: string
  name: string
  color: string
  values: Array<number | null>
}

export function NESSection() {
  const { t } = useTranslation()
  const { lang, nes, setNes } = useSettingsContext()
  const { file } = useUnstacked('nes', lang)
  const rows = useMemo(() => file?.data || [], [file])
  const meta = file?.meta || {}
  const indicatorLabel = meta[nes] || nes
  const colors = useGemColors()

  const [mapYear, setMapYear] = useState<number | null>(null)
  const [radarYear, setRadarYear] = useState<number | null>(null)
  const [mode, setMode] = useState<'combined' | 'separate'>('combined')

  const mapYears = useMemo(() => yearsFor(rows, (r) => isNum(r[nes])), [rows, nes])
  const radarYears = useMemo(
    () => yearsFor(rows, (r) => COUNTRIES.includes(String(r.country)) && AXES.some((k) => isNum(r[k]))),
    [rows]
  )

  useEffect(() => {
    if (!mapYears.length) return
    if (mapYear == null || !mapYears.includes(mapYear)) setMapYear(mapYears[mapYears.length - 1])
  }, [mapYears, mapYear])

  useEffect(() => {
    if (!radarYears.length) return
    if (radarYear == null || !radarYears.includes(radarYear)) setRadarYear(radarYears[radarYears.length - 1])
  }, [radarYears, radarYear])

  const series: RadarSeries[] = COUNTRIES.map((code, i) => {
    const row = rows.find((r) => r.country === code && Number(r.year) === radarYear)
    const anyRow = row || rows.find((r) => r.country === code)
    return {
      code,
      name: String(anyRow?.langcountry || code),
      color: colors[i % colors.length],
      values: AXES.map((k) => num(row, k)),
    }
  }).filter((s) => s.values.some((v) => v != null))

  const axisLabels = AXES.map((k) => meta[k] || k)

  return (
    <CollapsibleSection
      id="nes"
      title={t('sections.nes')}
      icon={SectionIcons.globe}
      defaultExpanded={false}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="gem-plate p-6 lg:col-span-3">
          <p className="gem-kicker">{t('nes.title')}</p>
          <h3 className="font-display mt-3 text-2xl font-semibold leading-tight text-[var(--color-text-primary)]">
            {indicatorLabel}
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {t('nes.description')}
          </p>
          <p className="mt-4 border-t border-[var(--color-border-subtle)] pt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {t('nes.methodology')}
          </p>
        </div>

        <div className="gem-plate p-6 lg:col-span-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <IndicatorSelect label="NES indicator" value={nes} options={meta} onChange={setNes} />
            <YearSlider years={mapYears} year={mapYear} onChange={setMapYear} play />
          </div>
          <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
            <WorldChoropleth rows={rows} year={mapYear} indicator={nes} height={400} />
          </div>
        </div>

        <div className="gem-plate p-6 lg:col-span-4">
          <p className="gem-kicker">{t('nes.efc')}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1.5">
              {(['combined', 'separate'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className="gem-pill"
                  aria-pressed={mode === m}
                  onClick={() => setMode(m)}
                >
                  {m === 'combined' ? 'Combined' : 'Separate'}
                </button>
              ))}
            </div>
            <YearSlider years={radarYears} year={radarYear} onChange={setRadarYear} />
          </div>

          <div className="mt-5 border-t border-[var(--color-border-subtle)] pt-4">
            {!series.length ? (
              <p className="text-sm text-[var(--color-text-muted)]">—</p>
            ) : mode === 'combined' ? (
              <>
                <Radar series={series} labels={axisLabels} size={300} />
                <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                  {series.map((s) => (
                    <li key={s.code} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                      <span className="h-px w-6" style={{ background: s.color }} />
                      {s.name}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {series.map((s) => (
                  <figure key={s.code}>
                    <Radar series={[s]} labels={axisLabels} size={180} compact />
                    <figcaption className="font-display mt-1 text-center text-sm font-semibold text-[var(--color-text-primary)]">
                      {s.name}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

function Radar({
  series,
  labels,
  size,
  compact = false,
}: {
  series: RadarSeries[]
  labels: string[]
  size: number
  compact?: boolean
}) {
  const pad = compact ? 22 : 34
  const c = size / 2
  const r = c - pad
  const n = AXES.length
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const point = (i: number, value: number) => {
    const d = (Math.max(0, Math.min(SCALE_MAX, value)) / SCALE_MAX) * r
    return [c + d * Math.cos(angle(i)), c + d * Math.sin(angle(i))]
  }
  const rings = [2, 4, 6, 8, 10]

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full" role="img">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={AXES.map((_, i) => point(i, ring).join(',')).join(' ')}
          fill="none"
          stroke="var(--color-border-subtle)"
          strokeWidth={1}
        />
      ))}
      {AXES.map((code, i) => {
        const [x, y] = point(i, SCALE_MAX)
        const [lx, ly] = point(i, SCALE_MAX * (1 + (compact ? 0.16 : 0.13)))
        const cos = Math.cos(angle(i))
        return (
          <g key={code}>
            <line x1={c} y1={c} x2={x} y2={y} stroke="var(--color-border-subtle)" strokeWidth={1} />
            <text
              x={lx}
              y={ly}
              fontSize={compact ? 7 : 9}
              fill="var(--color-text-muted)"
              textAnchor={Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end'}
              dominantBaseline="middle"
            >
              <title>{labels[i]}</title>
              {code}
            </text>
          </g>
        )
      })}
      {!compact && (
        <text x={c + 3} y={c - r - 3} fontSize={8} fill="var(--color-text-muted)" className="tabular">
          {SCALE_MAX}
        </text>
      )}
      {series.map((s) => (
        <g key={s.code}>
          <polygon
            points={s.values.map((v, i) => point(i, v ?? 0).join(',')).join(' ')}
            fill={s.color}
            fillOpacity={0.08}
            stroke={s.color}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          {s.values.map((v, i) => {
            const [x, y] = point(i, v ?? 0)
            return (
              <circle key={AXES[i]} cx={x} cy={y} r={compact ? 1.5 : 2} fill={s.color}>
                <title>{`${s.name} · ${labels[i]} (${AXES[i]}): ${formatStat(v, 2)}`}</title>
              </circle>
            )
          })}
        </g>
      ))}
    </svg>
  )
}

function isNum(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function yearsFor(rows: UnstackedRow[], keep: (row: UnstackedRow) => boolean): number[] {
  const set = new Set<number>()
  for (const r of rows) {
    const y = Number(r.year)
    if (Number.isFinite(y) && keep(r)) set.add(y)
  }
  return Array.from(set).sort((a, b) => a - b)
}
