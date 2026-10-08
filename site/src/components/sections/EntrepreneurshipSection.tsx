'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { IndicatorSelect } from '@/components/ui/IndicatorSelect'
import { YearSlider } from '@/components/ui/YearSlider'
import { GemPills } from '@/components/ui/GemPills'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { formatStat, latestRomania, num, useUnstacked, yearsOf, type UnstackedRow } from '@/lib/useUnstacked'
import { MapSkeleton } from '@/components/charts/GemMaps'

const NutsChoropleth = dynamic(
  () => import('@/components/charts/GemMaps').then((m) => m.NutsChoropleth),
  { ssr: false, loading: () => <MapSkeleton height={460} /> }
)

const SLICES = ['TEA', 'EBO', 'Opport'] as const
type Slice = (typeof SLICES)[number]

export function EntrepreneurshipSection() {
  const { t } = useTranslation()
  const { lang } = useSettingsContext()
  const { file: regio } = useUnstacked('regio', lang)
  const { file: aps } = useUnstacked('aps', lang)
  const [indicator, setIndicator] = useState('EBO')
  const [pickedYear, setPickedYear] = useState<number | null>(null)
  const [slice, setSlice] = useState<Slice>('TEA')

  const rows = useMemo(() => regio?.data || [], [regio])
  const options = useMemo(() => {
    const out: Record<string, string> = {}
    for (const [code, label] of Object.entries(regio?.meta || {})) out[code] = label ?? code
    return out
  }, [regio])
  const years = useMemo(
    () => yearsOf(rows.filter((row) => num(row, indicator) != null)),
    [rows, indicator]
  )
  const year = pickedYear != null && years.includes(pickedYear) ? pickedYear : years.at(-1) ?? null
  const apsRO = aps ? latestRomania(aps.data) : null
  const label = options[indicator] && options[indicator] !== indicator ? options[indicator] : null

  return (
    <CollapsibleSection
      id="entrepreneurship"
      title={t('sections.entrepreneurship')}
      icon={SectionIcons.entrepreneurship}
      defaultExpanded={false}
    >
      <div className="space-y-6">
        <div className="gem-plate lg:grid lg:grid-cols-12">
          <div className="border-b border-[var(--color-border-subtle)] p-6 md:p-8 lg:col-span-7 lg:border-b-0 lg:border-r">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div className="min-w-[14rem] flex-1">
                <IndicatorSelect
                  label={t('stats.indicators')}
                  value={indicator}
                  options={options}
                  onChange={setIndicator}
                />
              </div>
              <YearSlider years={years} year={year} onChange={setPickedYear} play />
            </div>
            <p className="gem-kicker mt-6">
              {t('nav.regional')} · {indicator}
              {label ? ` · ${label}` : ''}
            </p>
            <div className="mt-2">
              <NutsChoropleth rows={rows} year={year} indicator={indicator} height={460} />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-6 border-t border-[var(--color-border-subtle)] pt-6">
              <NationalFigure code="TEA" label={t('stats.tea')} value={num(apsRO, 'TEA')} year={apsRO?.year} />
              <NationalFigure code="EBO" label={t('stats.ebo')} value={num(apsRO, 'EBO')} year={apsRO?.year} />
            </dl>
          </div>

          <div className="p-6 md:p-8 lg:col-span-5">
            <p className="gem-kicker">
              {t('entrepreneurship.profileTitle')} · {indicator} {year ?? ''}
            </p>
            <RegionList rows={rows} year={year} field={indicator} lead />
          </div>
        </div>

        <div className="gem-plate p-6 md:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <p className="gem-kicker">
              {t('entrepreneurship.profiles')} {year ?? ''}
            </p>
            <div className="lg:hidden">
              <GemPills
                options={SLICES.map((id) => ({ id, label: id }))}
                value={slice}
                onChange={(id) => setSlice(id as Slice)}
              />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-0">
            {SLICES.map((field, i) => (
              <div
                key={field}
                className={`${field === slice ? 'block' : 'hidden'} lg:block ${
                  i > 0 ? 'lg:border-l lg:border-[var(--color-border-subtle)] lg:pl-8' : ''
                } ${i < SLICES.length - 1 ? 'lg:pr-8' : ''}`}
              >
                <p className="font-display text-lg font-semibold text-[var(--color-text-primary)]">{field}</p>
                <RegionList rows={rows} year={year} field={field} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

function RegionList({
  rows,
  year,
  field,
  lead = false,
}: {
  rows: UnstackedRow[]
  year: number | null
  field: string
  lead?: boolean
}) {
  const items = rows
    .filter((row) => Number(row.year) === year && row.id != null)
    .map((row) => ({
      id: String(row.id),
      name: String(row.langcountry || row.country || row.id),
      value: num(row, field),
    }))
    .sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity))
  const max = Math.max(0, ...items.map((item) => item.value ?? 0))

  if (!items.length) {
    return <p className="mt-4 text-sm text-[var(--color-text-muted)]">—</p>
  }

  return (
    <ul className="mt-4">
      {items.map((item, i) => (
        <li
          key={item.id}
          className="border-t border-[var(--color-border-subtle)] py-3 first:border-t-0 first:pt-0"
        >
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm leading-snug text-[var(--color-text-secondary)]">{item.name}</p>
            <p
              className={`font-display font-semibold tabular ${lead ? 'text-2xl' : 'text-xl'} ${
                lead && i === 0 && item.value != null ? 'text-primary' : 'text-[var(--color-text-primary)]'
              }`}
            >
              {item.value == null ? '—' : formatStat(item.value, 1)}
            </p>
          </div>
          <div className="mt-2 h-px bg-[var(--color-bg-tertiary)]">
            <div
              className="h-px bg-primary"
              style={{ width: `${max > 0 && item.value != null ? (item.value / max) * 100 : 0}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function NationalFigure({
  code,
  label,
  value,
  year,
}: {
  code: string
  label: string
  value: number | null
  year: UnstackedRow['year'] | undefined
}) {
  return (
    <div>
      <dt className="gem-kicker">
        {code} · RO {year ?? ''}
      </dt>
      <dd className="font-display mt-2 text-3xl font-semibold tabular text-[var(--color-text-primary)]">
        {value == null ? '—' : `${formatStat(value, 1)}%`}
      </dd>
      <p className="mt-1 text-xs leading-snug text-[var(--color-text-secondary)]">{label}</p>
    </div>
  )
}
