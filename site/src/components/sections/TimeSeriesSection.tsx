'use client'

import { useState } from 'react'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { GemPills } from '@/components/ui/GemPills'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { seriesForCountry, sumByYear, useUnstacked } from '@/lib/useUnstacked'
import { MultiLineChart } from '@/components/charts/GemCharts'

export function TimeSeriesSection() {
  const { t } = useTranslation()
  const { lang } = useSettingsContext()
  const { file: stats } = useUnstacked('ro_stats', lang)
  const { file: aps } = useUnstacked('aps', lang)
  const [selectedChart, setSelectedChart] = useState('enterprises')

  const chartOptions = [
    { id: 'enterprises', label: 'Active Enterprises' },
    { id: 'tea', label: 'TEA Rate Over Time' },
    { id: 'comparison', label: 'Romania vs peers' },
  ]

  const series =
    selectedChart === 'enterprises'
      ? [{ id: 'enterprises', label: 'Active enterprises', points: sumByYear(stats?.data || [], 'TEMPO_INT101O_3_2_2022') }]
      : selectedChart === 'tea'
        ? [{ id: 'tea', label: 'Romania TEA', points: seriesForCountry(aps?.data || [], 'RO', 'TEA') }]
        : ['RO', 'HU', 'PL', 'HR'].map((code) => ({
            id: code,
            label: code,
            points: seriesForCountry(aps?.data || [], code, 'TEA'),
          }))

  const active = chartOptions.find((option) => option.id === selectedChart)

  return (
    <CollapsibleSection
      id="trends"
      title={t('sections.trends')}
      icon={SectionIcons.statistics}
      defaultExpanded={false}
    >
      <div className="gem-plate">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border-subtle)] px-6 py-5">
          <div>
            <p className="gem-kicker">{t('sections.trendsDesc')}</p>
            <h3 className="font-display mt-1 text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              {active?.label}
            </h3>
          </div>
          <GemPills options={chartOptions} value={selectedChart} onChange={setSelectedChart} />
        </div>
        <div className="p-4 md:p-6">
          <MultiLineChart series={series} height={320} />
        </div>
      </div>
    </CollapsibleSection>
  )
}
