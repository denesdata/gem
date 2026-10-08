'use client'

import { useState } from 'react'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { GemPills } from '@/components/ui/GemPills'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { formatStat, latestRomania, latestYear, num, seriesForCountry, useUnstacked } from '@/lib/useUnstacked'
import { MultiLineChart, RadarChart } from '@/components/charts/GemCharts'
import { ScatterChart } from '@/components/charts/ScatterChart'
import { EFC_CONDITIONS } from '@/lib/efc'

export function GEMResearchSection() {
  const [activeTab, setActiveTab] = useState<'aps' | 'nes'>('aps')

  return (
    <CollapsibleSection
      id="research"
      title="GEM Research Data"
      icon={SectionIcons.globe}
      defaultExpanded={true}
    >
      <div className="space-y-6">
        <GemPills
          options={[
            { id: 'aps', label: 'Adult Population Survey' },
            { id: 'nes', label: 'National Expert Survey' },
          ]}
          value={activeTab}
          onChange={(id) => setActiveTab(id as 'aps' | 'nes')}
        />

        {activeTab === 'aps' && <ApsResearch />}
        {activeTab === 'nes' && <NesResearch />}
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

function Intro({ kicker, title, children }: { kicker: string; title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl">
      <p className="gem-kicker">{kicker}</p>
      <h3 className="font-display mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{children}</p>
    </div>
  )
}

function ApsResearch() {
  const { lang } = useSettingsContext()
  const { file: aps } = useUnstacked('aps', lang)
  const { file: nes } = useUnstacked('nes', lang)
  const year = aps ? latestYear(aps.data) : null
  const nesByCountry = new Map(
    (nes?.data || [])
      .filter((row) => Number(row.year) === year)
      .map((row) => [String(row.country), row])
  )
  const scatter = (aps?.data || [])
    .filter((row) => Number(row.year) === year)
    .map((row) => {
      const tea = num(row, 'TEA')
      const neci = num(nesByCountry.get(String(row.country)), 'NECI')
      if (tea == null || neci == null) return null
      return { id: String(row.country), name: String(row.langcountry || row.country), x: neci, y: tea }
    })
    .filter((row): row is { id: string; name: string; x: number; y: number } => Boolean(row))

  return (
    <div className="space-y-6 animate-fadeIn">
      <Intro kicker={`APS ${year ?? ''}`} title="Adult Population Survey (APS)">
        The APS measures entrepreneurial attitudes, activity, and aspirations across the adult population.
        It provides comparable data on entrepreneurship rates, motivations, and demographics across 50+ economies.
      </Intro>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="gem-plate">
          <PlateHead kicker="TEA · NECI" title="TEA vs NECI Comparison" />
          <div className="h-[350px] p-2">
            <ScatterChart points={scatter} xLabel="NECI" yLabel="TEA %" height={330} />
          </div>
        </div>

        <div className="gem-plate">
          <PlateHead kicker="RO · HU · PL · HR" title="TEA over time" />
          <div className="p-4">
            <MultiLineChart
              height={300}
              series={['RO', 'HU', 'PL', 'HR'].map((code) => ({
                id: code,
                label: code,
                points: seriesForCountry(aps?.data || [], code, 'TEA'),
              }))}
            />
          </div>
        </div>
      </div>

      <div className="gem-plate">
        <PlateHead kicker={`APS ${year ?? ''}`} title="Romania vs European Peers" />
        <div className="px-6 pb-4 pt-2">
          <CountryComparison />
        </div>
      </div>
    </div>
  )
}

function NesResearch() {
  const { lang } = useSettingsContext()
  const { file } = useUnstacked('nes', lang)
  const latest = file ? latestRomania(file.data) : null
  const radarAxes = EFC_CONDITIONS
    .map((condition) => ({
      key: condition.code.replace('EFC', ''),
      label: condition.name,
      value: num(latest, condition.code) ?? 0,
    }))
    .filter((axis) => axis.value > 0)
  const highlights = [
    { code: 'EFC1a', name: 'Finance' },
    { code: 'EFC4b', name: 'Education' },
    { code: 'EFC8', name: 'Infrastructure' },
    { code: 'EFC9', name: 'Culture' },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      <Intro kicker={`NES ${latest?.year ?? ''}`} title="National Expert Survey (NES)">
        The NES evaluates Entrepreneurial Framework Conditions through expert assessment.
        These conditions measure the quality of the entrepreneurial ecosystem in each economy.
      </Intro>

      <div className="gem-plate">
        <div className="h-[400px]">
          <RadarChart axes={radarAxes} height={380} />
        </div>
        <dl className="grid grid-cols-2 border-t border-[var(--color-border-subtle)] md:grid-cols-4 md:divide-x md:divide-[var(--color-border-subtle)]">
          {highlights.map((efc, i) => (
            <div
              key={efc.code}
              className={`flex flex-col-reverse px-6 py-5 ${i % 2 === 1 ? 'border-l border-[var(--color-border-subtle)] md:border-l-0' : ''} ${
                i >= 2 ? 'border-t border-[var(--color-border-subtle)] md:border-t-0' : ''
              }`}
            >
              <dt className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {efc.name} <span className="ml-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{efc.code}</span>
              </dt>
              <dd className="font-display text-3xl font-semibold tabular text-[var(--color-text-primary)]">
                {formatStat(num(latest, efc.code), 1)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}

function CountryComparison() {
  const { lang } = useSettingsContext()
  const { file } = useUnstacked('aps', lang)
  const year = file ? latestYear(file.data) : null
  const wanted = ['RO', 'HU', 'PL']
  const countries = wanted.map((code) => {
    const row = file?.data.find((r) => r.year === year && r.country === code)
    return {
      name: String(row?.langcountry || code),
      tea: num(row, 'TEA'),
      ebo: num(row, 'EBO'),
      intent: num(row, 'Intent'),
    }
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border-subtle)]">
            <th className="gem-kicker py-3 text-left font-normal">Country</th>
            <th className="gem-kicker py-3 text-right font-normal">TEA %</th>
            <th className="gem-kicker py-3 text-right font-normal">EBO %</th>
            <th className="gem-kicker py-3 text-right font-normal">Intent %</th>
          </tr>
        </thead>
        <tbody>
          {countries.map((c, i) => (
            <tr key={c.name} className="border-b border-[var(--color-border-subtle)] last:border-0">
              <td className={`py-3 ${i === 0 ? 'font-semibold text-primary' : 'text-[var(--color-text-secondary)]'}`}>
                {c.name}
              </td>
              <td className="font-display py-3 text-right text-lg tabular text-[var(--color-text-primary)]">{formatStat(c.tea, 1)}</td>
              <td className="font-display py-3 text-right text-lg tabular text-[var(--color-text-primary)]">{formatStat(c.ebo, 1)}</td>
              <td className="font-display py-3 text-right text-lg tabular text-[var(--color-text-primary)]">{formatStat(c.intent, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
