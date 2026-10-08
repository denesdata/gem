'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { IndicatorSelect } from '@/components/ui/IndicatorSelect'
import { YearSlider } from '@/components/ui/YearSlider'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { latestYear, useUnstacked, yearsOf } from '@/lib/useUnstacked'
import { MapSkeleton } from '@/components/charts/GemMaps'

const CountyChoropleth = dynamic(
  () => import('@/components/charts/GemMaps').then((m) => m.CountyChoropleth),
  { ssr: false, loading: () => <MapSkeleton height={480} /> }
)

export function RomaniaMapSection() {
  const { t } = useTranslation()
  const { lang, rostats, setRostats } = useSettingsContext()
  const { file } = useUnstacked('ro_stats', lang)
  const rows = file?.data || []
  const years = yearsOf(rows)
  const fallbackYear = file ? latestYear(file.data) : null
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const year = selectedYear && years.includes(selectedYear) ? selectedYear : fallbackYear
  const meta = file?.meta || { TEMPO_INT101O_3_2_2022: 'Active enterprises by counties' }
  const indicatorLabel = (meta as Record<string, string>)[rostats]

  return (
    <CollapsibleSection
      id="regional"
      title={t('sections.regionalData')}
      icon={SectionIcons.map}
      defaultExpanded={false}
    >
      <div className="gem-plate">
        <div className="border-b border-[var(--color-border-subtle)] px-6 py-5">
          <p className="gem-kicker">{t('sections.regionalDataDesc')}</p>
          <h3 className="font-display mt-1 text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {indicatorLabel || rostats}
            {year != null ? <span className="ml-2 tabular text-[var(--color-text-muted)]">{year}</span> : null}
          </h3>
        </div>

        <div className="grid gap-6 border-b border-[var(--color-border-subtle)] px-6 py-5 md:grid-cols-2">
          <IndicatorSelect
            label="Indicator"
            value={rostats}
            options={meta}
            onChange={setRostats}
          />

          <YearSlider years={years} year={year} onChange={setSelectedYear} play />
        </div>

        <div className="p-4 md:p-6">
          <CountyChoropleth rows={rows} year={year} indicator={rostats} height={480} />
        </div>
      </div>
    </CollapsibleSection>
  )
}
