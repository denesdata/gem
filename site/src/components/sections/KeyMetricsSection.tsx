'use client'

import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { formatStat, latestRomania, num, ordinal, rankAmong, useUnstacked } from '@/lib/useUnstacked'

export function KeyMetricsSection() {
  const { t } = useTranslation()
  const { lang } = useSettingsContext()
  const { file: aps } = useUnstacked('aps', lang)
  const { file: nes } = useUnstacked('nes', lang)
  const apsRO = aps ? latestRomania(aps.data) : null
  const nesRO = nes ? latestRomania(nes.data) : null
  const year = apsRO?.year || nesRO?.year

  const attitudes = [
    { code: 'business', key: 'attitudes.knows' },
    { code: 'Opport', key: 'attitudes.opportunities' },
    { code: 'Suskil', key: 'attitudes.skills' },
    { code: 'Frfail', key: 'attitudes.fear' },
    { code: 'Intent', key: 'attitudes.easy' },
  ].map((item) => ({ ...item, value: pct(num(apsRO, item.code)) }))

  const rankingYear = nesRO ? Number(nesRO.year) : null
  const rankingDefs = [
    { indicator: 'EFC1a', key: 'rankings.financing' },
    { indicator: 'EFC3', key: 'rankings.programs' },
    { indicator: 'EFC4b', key: 'rankings.education' },
    { indicator: 'EFC8', key: 'rankings.infrastructure' },
    { indicator: 'EFC7b', key: 'rankings.market' },
  ]
  const rankings = rankingDefs.map((d) => {
    const ranked = rankingYear && nes ? rankAmong(nes.data, rankingYear, d.indicator) : null
    return {
      ...d,
      position: ranked ? ordinal(ranked.rank) : '—',
      total: ranked?.total ?? null,
    }
  })

  return (
    <section id="overview" className="container mx-auto px-4">
      <div className="section-header mb-6">
        <h2 className="text-xl md:text-2xl font-semibold">{t('sections.keyIndicators')}</h2>
        <p className="text-sm mt-1">{t('sections.keyIndicatorsDesc')}</p>
      </div>

      <div className="gem-plate">
        <div className="lg:grid lg:grid-cols-12">
          <div className="border-b border-[var(--color-border-subtle)] p-6 md:p-8 lg:col-span-4 lg:border-b-0 lg:border-r">
            <p className="gem-kicker">
              APS <span className="tabular">{year ? String(year) : '—'}</span>
            </p>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              GEM began in 1999 as a joint research project between Babson College (USA) and London Business School (UK).
              The consortium has become the leading source of reliable information on the state of entrepreneurship and
              entrepreneurial ecosystems around the world.
            </p>
            <p className="mt-6 text-xs text-[var(--color-text-muted)]">
              {t('footer.lastUpdated')} <span className="tabular">{year || '—'}</span>
            </p>
          </div>

          <ul className="divide-y divide-[var(--color-border-subtle)] lg:col-span-8 lg:grid lg:grid-cols-5 lg:divide-x lg:divide-y-0">
            {attitudes.map((item) => (
              <li
                key={item.code}
                className="flex flex-row-reverse items-baseline justify-between gap-6 px-6 py-4 lg:block lg:px-5 lg:py-8"
              >
                <p className="font-display text-3xl font-semibold tabular text-[var(--color-text-primary)]">{item.value}</p>
                <p className="max-w-[46ch] text-sm leading-snug text-[var(--color-text-secondary)] lg:mt-3 lg:text-xs">
                  {t(item.key)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-[var(--color-border-subtle)] px-6 py-5 md:px-8">
          <p className="gem-kicker mb-3">{t('rankings.title')}</p>
          <ol className="flex flex-wrap gap-x-8 gap-y-3">
            {rankings.map((item) => (
              <li key={item.indicator} className="flex items-baseline gap-2">
                <span className="text-xs text-[var(--color-text-secondary)]">{t(item.key)}</span>
                <span className="font-display text-base font-semibold tabular text-primary">
                  {item.position}
                  {item.total ? (
                    <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)]">/ {item.total}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function pct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return `${formatStat(value, 0)}%`
}
