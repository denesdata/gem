'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { IndicatorSelect } from '@/components/ui/IndicatorSelect'
import { YearSlider } from '@/components/ui/YearSlider'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { num, useUnstacked, yearsOf, type UnstackedRow } from '@/lib/useUnstacked'
import { NUTS2, nutsForCounty } from '@/lib/nuts'
import { MultiLineChart, type SeriesLine } from '@/components/charts/GemCharts'
import { MapSkeleton } from '@/components/charts/GemMaps'
import { panelUrl } from '@/lib/panelHost'

const CountyChoropleth = dynamic(
  () => import('@/components/charts/GemMaps').then((m) => m.CountyChoropleth),
  { ssr: false, loading: () => <MapSkeleton height={360} /> }
)

const NutsChoropleth = dynamic(
  () => import('@/components/charts/GemMaps').then((m) => m.NutsChoropleth),
  { ssr: false, loading: () => <MapSkeleton height={360} /> }
)

interface NationalSeries {
  type: string
  category: string
  points: Array<{ year: number; value: number }>
}

const ENTERPRISES = 'TEMPO_INT101O_3_2_2022'

const SIZE_CLASSES = [
  ['0-9 persoane', '0–9'],
  ['10-49 persoane', '10–49'],
  ['50-249 persoane', '50–249'],
  ['250 persoane si peste', '250+'],
] as const

const THOUSAND = 1e3
const BILLION = 1e9

function scaled(points: NationalSeries['points'], divisor: number) {
  return points.map((p) => ({ year: p.year, value: p.value / divisor }))
}

function sectorSeries(series: NationalSeries[]): SeriesLine[] {
  return series.filter((s) => s.type === 'TEMPO_INT101O_13_2_2022_sect' && /^[A-S]\b/.test(s.category))
    .sort((a, b) => a.category.localeCompare(b.category))
    .map((s) => ({ id: s.category, label: s.category.charAt(0), points: scaled(s.points, THOUSAND) }))
}

function sizeClassSeries(series: NationalSeries[], type: string, divisor: number): SeriesLine[] {
  return SIZE_CLASSES.flatMap(([category, label]) => {
    const s = series.find((item) => item.type === type && item.category === category)
    return s ? [{ id: category, label, points: scaled(s.points, divisor) }] : []
  })
}

export function StatisticsSection() {
  const { t } = useTranslation()
  const { lang, rostats, setRostats } = useSettingsContext()
  const { file } = useUnstacked('ro_stats', lang)
  const rows = useMemo(() => file?.data || [], [file])
  const meta = file?.meta || {}
  const [series, setSeries] = useState<NationalSeries[]>([])

  useEffect(() => {
    fetch(panelUrl('rostats_national.json'))
      .then((res) => (res.ok ? res.json() : { series: [] }))
      .then((json) => setSeries(Array.isArray(json?.series) ? json.series : []))
      .catch(() => setSeries([]))
  }, [])


  const regionRows = useMemo(() => {
    const totals = new Map<string, number>()
    for (const row of rows) {
      const region = nutsForCounty(String(row.country || ''))
      const value = num(row, ENTERPRISES)
      if (!region || value == null) continue
      const key = `${region.id}|${row.year}`
      totals.set(key, (totals.get(key) || 0) + value)
    }
    return Array.from(totals.entries()).map(([key, enterprises]): UnstackedRow => {
      const [id, year] = key.split('|')
      const region = NUTS2.find((r) => r.id === id)
      return { id, year: Number(year), langcountry: region?.name, enterprises }
    })
  }, [rows])

  const regionYears = useMemo(() => yearsOf(regionRows), [regionRows])
  const countyYears = useMemo(
    () => yearsOf(rows.filter((row) => num(row, rostats) != null)),
    [rows, rostats]
  )
  const [pickedRegionYear, setRegionYear] = useState<number | null>(null)
  const [pickedCountyYear, setCountyYear] = useState<number | null>(null)
  const regionYear = pick(regionYears, pickedRegionYear)
  const countyYear = pick(countyYears, pickedCountyYear)

  const sectors = useMemo(() => sectorSeries(series), [series])
  const sizes = useMemo(() => sizeClassSeries(series, 'TEMPO_INT101O_3_2_2022_1', THOUSAND), [series])
  const employment = useMemo(() => sizeClassSeries(series, 'TEMPO_RSI101A_3_2_2022_sal', THOUSAND), [series])
  const turnover = useMemo(() => sizeClassSeries(series, 'TEMPO_RSI101A_3_2_2022_ca', BILLION), [series])

  return (
    <CollapsibleSection
      id="statistics"
      title={t('sections.statistics')}
      icon={SectionIcons.statistics}
      defaultExpanded={false}
    >
      <div className="space-y-6">
        <p className="text-sm text-[var(--color-text-secondary)]">{t('statistics.changeNote')}</p>

        <div className="gem-plate lg:grid lg:grid-cols-12">
          <div className="border-b border-[var(--color-border-subtle)] p-6 lg:col-span-4 lg:border-b-0 lg:border-r">
            <p className="gem-kicker">{t('statistics.counties')} · NUTS 2</p>
            <div className="mt-4">
              <YearSlider years={regionYears} year={regionYear} onChange={setRegionYear} play />
            </div>
            <div className="mt-2">
              <NutsChoropleth rows={regionRows} year={regionYear} indicator="enterprises" height={360} />
            </div>
          </div>

          <div className="border-b border-[var(--color-border-subtle)] p-6 lg:col-span-4 lg:border-b-0 lg:border-r">
            <IndicatorSelect
              label={t('stats.indicators')}
              value={rostats}
              options={meta}
              onChange={setRostats}
            />
            <div className="mt-4">
              <YearSlider years={countyYears} year={countyYear} onChange={setCountyYear} play />
            </div>
            <div className="mt-2">
              <CountyChoropleth rows={rows} year={countyYear} indicator={rostats} height={360} />
            </div>
          </div>

          <div className="p-6 lg:col-span-4">
            <ChartHead title={t('statistics.sectors')} unit="×1 000" />
            <div className="mt-4">
              <MultiLineChart series={sectors} height={300} />
            </div>
          </div>
        </div>

        <div className="gem-plate grid grid-cols-1 lg:grid-cols-3">
          <ChartCell title={t('statistics.sizeClasses')} unit="×1 000" series={sizes} />
          <ChartCell title={t('statistics.employment')} unit="×1 000" series={employment} bordered />
          <ChartCell title={t('statistics.turnover')} unit="×10⁹" series={turnover} bordered />
        </div>
      </div>
    </CollapsibleSection>
  )
}

function pick(years: number[], picked: number | null) {
  return picked != null && years.includes(picked) ? picked : years.at(-1) ?? null
}

function ChartHead({ title, unit }: { title: string; unit: string }) {
  return (
    <div>
      <p className="gem-kicker">{unit}</p>
      <h3 className="font-display mt-2 text-lg font-semibold leading-snug text-[var(--color-text-primary)]">
        {title}
      </h3>
    </div>
  )
}

function ChartCell({
  title,
  unit,
  series,
  bordered = false,
}: {
  title: string
  unit: string
  series: SeriesLine[]
  bordered?: boolean
}) {
  return (
    <div
      className={`p-6 ${
        bordered ? 'border-t border-[var(--color-border-subtle)] lg:border-l lg:border-t-0' : ''
      }`}
    >
      <ChartHead title={title} unit={unit} />
      <div className="mt-4">
        <MultiLineChart series={series} height={220} />
      </div>
    </div>
  )
}
