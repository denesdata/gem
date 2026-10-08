'use client'

import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { formatStat, latestRomania, num, ordinal, rankAmong, useUnstacked } from '@/lib/useUnstacked'

export function KeyIndicatorsTwo() {
  const { t } = useTranslation()
  const { lang } = useSettingsContext()
  const { file: aps } = useUnstacked('aps', lang)
  const { file: nes } = useUnstacked('nes', lang)
  const apsRO = aps ? latestRomania(aps.data) : null
  const nesRO = nes ? latestRomania(nes.data) : null
  const year = apsRO?.year || nesRO?.year
  const rankingYear = nesRO ? Number(nesRO.year) : null

  const companions = [
    { code: 'EBO', label: t('stats.ebo'), value: num(apsRO, 'EBO') },
    { code: 'Intent', label: t('stats.intent'), value: num(apsRO, 'Intent') },
    { code: 'EEA', label: t('stats.eea'), value: num(apsRO, 'EEA') },
  ]

  const attitudes = [
    { label: t('attitudes.knows'), value: num(apsRO, 'business') },
    { label: t('attitudes.opportunities'), value: num(apsRO, 'Opport') },
    { label: t('attitudes.skills'), value: num(apsRO, 'Suskil') },
    { label: t('attitudes.fear'), value: num(apsRO, 'Frfail') },
    { label: t('attitudes.easy'), value: num(apsRO, 'Intent') },
  ]

  const rankingDefs = [
    { indicator: 'EFC1a', label: t('rankings.financing') },
    { indicator: 'EFC3', label: t('rankings.programs') },
    { indicator: 'EFC4b', label: t('rankings.education') },
    { indicator: 'EFC8', label: t('rankings.infrastructure') },
    { indicator: 'EFC7b', label: t('rankings.market') },
  ]
  const rankings = rankingDefs.map((item) => {
    const ranked = rankingYear && nes ? rankAmong(nes.data, rankingYear, item.indicator) : null
    return {
      ...item,
      place: ranked ? ordinal(ranked.rank) : '—',
      total: ranked?.total ?? null,
    }
  })

  return (
    <section id="indicators-2" className="container mx-auto px-4">
      <div className="section-header mb-6">
        <h2 className="text-xl font-semibold md:text-2xl">{t('sections.keyIndicators2')}</h2>
        <p className="mt-1 text-sm">{year ? String(year) : t('sections.keyIndicatorsDesc')}</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)] lg:grid lg:grid-cols-12">
        <div className="flex flex-col border-b border-[var(--color-border-subtle)] p-6 md:p-10 lg:col-span-5 lg:border-b-0 lg:border-r">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {t('stats.teaShort')} {year ? String(year) : ''}
          </p>
          <p className="font-display mt-4 text-[5.5rem] font-semibold leading-none tracking-[-0.04em] text-primary tabular md:text-[7rem]">
            {pct(num(apsRO, 'TEA'))}
          </p>
          <p className="mt-4 max-w-[28ch] text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {t('stats.tea')}
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[var(--color-border-subtle)] pt-6">
            {companions.map((item) => (
              <div key={item.code}>
                <p className="font-display text-3xl font-semibold tabular text-[var(--color-text-primary)]">
                  {pct(item.value)}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">{item.code}</p>
                <p className="mt-1 text-xs leading-snug text-[var(--color-text-secondary)]">{item.label}</p>
              </div>
            ))}
          </div>

          <dl className="mt-8 space-y-3 border-t border-[var(--color-border-subtle)] pt-6 text-sm">
            <IndexRow label={t('stats.neci')} value={formatStat(nesRO?.NECI, 1)} />
            <IndexRow label={t('stats.infrastructure')} value={formatStat(nesRO?.EFC8, 1)} />
          </dl>
        </div>

        <div className="p-6 md:p-10 lg:col-span-7">
          <p className="mb-5 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
            {t('sections.keyIndicators')}
          </p>
          <ul>
            {attitudes.map((item) => (
              <li key={item.label} className="border-t border-[var(--color-border-subtle)] py-4 first:border-t-0 first:pt-0">
                <div className="flex items-baseline justify-between gap-6">
                  <p className="max-w-[46ch] text-sm leading-snug text-[var(--color-text-secondary)]">{item.label}</p>
                  <p className="font-display text-3xl font-semibold tabular text-[var(--color-text-primary)]">
                    {pct(item.value)}
                  </p>
                </div>
                <div className="mt-3 h-px bg-[var(--color-bg-tertiary)]">
                  <div
                    className="h-px bg-primary"
                    style={{ width: `${Math.max(0, Math.min(100, item.value ?? 0))}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-10 border-t border-[var(--color-border-subtle)] pt-6">
            <p className="text-sm text-[var(--color-text-muted)]">{t('rankings.title')}</p>
            <ol className="mt-4">
              {rankings.map((item) => (
                <li
                  key={item.indicator}
                  className="flex items-baseline justify-between gap-4 border-b border-[var(--color-border-subtle)] py-2.5 last:border-b-0"
                >
                  <span className="text-sm text-[var(--color-text-secondary)]">{item.label}</span>
                  <span className="font-display text-lg font-semibold tabular text-primary">
                    {item.place}
                    {item.total ? <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">/ {item.total}</span> : null}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

function pct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${formatStat(value, 0)}%`
}

function IndexRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="font-display text-xl font-semibold tabular text-[var(--color-text-primary)]">{value}</dd>
    </div>
  )
}
