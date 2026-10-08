'use client'

import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { formatStat, latestYear, sumByYear, useUnstacked } from '@/lib/useUnstacked'
import { HorizontalBars, MultiLineChart } from '@/components/charts/GemCharts'

export function RomaniaOverviewSection() {
  const { lang } = useSettingsContext()
  const { file } = useUnstacked('ro_stats', lang)
  const { file: regio2 } = useUnstacked('regio2', lang)
  const rows = file?.data || []
  const year = file ? latestYear(file.data) : null
  const enterprises = sumByYear(rows, 'TEMPO_INT101O_3_2_2022')
  const dissolving = sumByYear(rows, 'ONRC3')
  const erasures = sumByYear(rows, 'ONRC4')
  const newFirms = sumByYear(regio2?.data || [], 'TEMPO_INT111C_3_2_2022_nou')
  const latestEnterprises = enterprises.at(-1)?.value
  const prevEnterprises = enterprises.at(-2)?.value
  const latestNew = newFirms.at(-1)?.value
  const prevNew = newFirms.at(-2)?.value
  const latestDiss = dissolving.at(-1)?.value
  const prevDiss = dissolving.at(-2)?.value
  const latestErase = erasures.at(-1)?.value
  const prevErase = erasures.at(-2)?.value
  const men = sumByYear(rows, 'ONRC1:barbati').at(-1)?.value ?? 0
  const women = sumByYear(rows, 'ONRC1:femei').at(-1)?.value ?? 0
  const genderTotal = men + women || 1

  return (
    <CollapsibleSection
      id="romania"
      title="Romania at a Glance"
      icon={SectionIcons.statistics}
      defaultExpanded={false}
    >
      <div className="space-y-6">
        <div className="gem-plate">
          <dl className="grid grid-cols-2 md:grid-cols-4">
            <QuickStat label="Active Enterprises" value={latestEnterprises} prev={prevEnterprises} year={year} index={0} />
            <QuickStat label="New enterprises" value={latestNew} prev={prevNew} index={1} />
            <QuickStat label="Dissolving" value={latestDiss} prev={prevDiss} invert index={2} />
            <QuickStat label="Erasures" value={latestErase} prev={prevErase} invert index={3} />
          </dl>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="gem-plate">
            <PlateHead kicker={`INS · ${year ?? ''}`} title="Active enterprises" />
            <div className="p-4">
              <MultiLineChart
                height={280}
                series={[{ id: 'enterprises', label: 'Active enterprises', points: enterprises }]}
              />
            </div>
          </div>

          <div className="gem-plate">
            <PlateHead kicker="ONRC" title="Company owners by gender" />
            <div className="p-6">
              <HorizontalBars
                items={[
                  { label: 'Male', value: men, accent: 4 },
                  { label: 'Female', value: women, accent: 0 },
                ]}
              />
              <p className="mt-6 border-t border-[var(--color-border-subtle)] pt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Female owners are{' '}
                <span className="font-display font-semibold tabular text-[var(--color-text-primary)]">
                  {formatStat((women / genderTotal) * 100, 0)}%
                </span>{' '}
                of the latest ONRC total.
              </p>
            </div>
          </div>
        </div>

        <div className="gem-plate">
          <PlateHead kicker="ONRC" title="Dissolving vs erasures" />
          <div className="p-4">
            <MultiLineChart
              height={220}
              series={[
                { id: 'dissolving', label: 'Dissolving', points: dissolving },
                { id: 'erasures', label: 'Erasures', points: erasures },
              ]}
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}

function PlateHead({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="border-b border-[var(--color-border-subtle)] px-6 py-4">
      <p className="gem-kicker">{kicker}</p>
      <h4 className="font-display mt-1 text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">{title}</h4>
    </div>
  )
}

function QuickStat({
  label,
  value,
  prev,
  year,
  invert = false,
  index,
}: {
  label: string
  value?: number
  prev?: number
  year?: number | null
  invert?: boolean
  index: number
}) {
  const change = value != null && prev ? ((value - prev) / prev) * 100 : null
  const isPositive = change != null && (invert ? change < 0 : change > 0)
  const edges = [
    index % 2 === 1 ? 'border-l' : '',
    index >= 2 ? 'border-t md:border-t-0' : '',
    index >= 1 ? 'md:border-l' : '',
  ].join(' ')

  return (
    <div className={`flex flex-col-reverse border-[var(--color-border-subtle)] p-5 md:p-6 ${edges}`}>
      <dd className={`mt-2 text-xs tabular ${change == null ? 'text-[var(--color-text-muted)]' : isPositive ? 'text-primary' : 'text-[var(--color-text-secondary)]'}`}>
        {change == null ? (year ? String(year) : '—') : `${change > 0 ? '+' : ''}${change.toFixed(1)}% vs prior year`}
      </dd>
      <dd className="font-display text-3xl font-semibold tabular text-[var(--color-text-primary)]">
        {value == null ? '—' : Math.round(value).toLocaleString()}
      </dd>
      <dt className="gem-kicker mb-2">{label}</dt>
    </div>
  )
}
