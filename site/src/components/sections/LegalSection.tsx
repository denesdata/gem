'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { LegalFormCard, LegalQuiz } from '@/components/sections/LegalQuiz'
import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { latestPeriod, useUnstacked } from '@/lib/useUnstacked'
import { MapSkeleton } from '@/components/charts/GemMaps'
import type { LegalForm } from '@/lib/legalQuiz'

const CountyChoropleth = dynamic(
  () => import('@/components/charts/GemMaps').then((m) => m.CountyChoropleth),
  { ssr: false, loading: () => <MapSkeleton height={360} /> },
)

export function LegalSection() {
  const { t } = useTranslation()
  const { lang } = useSettingsContext()
  const { file } = useUnstacked('legal', lang)
  const period = file ? latestPeriod(file.data) : null
  const [pick, setPick] = useState<LegalForm | null>(null)

  return (
    <CollapsibleSection
      id="legal"
      title={t('sections.legal')}
      icon={SectionIcons.legal}
      defaultExpanded={false}
    >
      <div className="space-y-8">
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">
          {t('legal.description')}
        </p>

        <LegalQuiz onResult={setPick} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:col-span-8">
            <LegalFormCard form="pfa" active={pick === 'pfa'} dimmed={pick === 'srl'} />
            <LegalFormCard form="srl" active={pick === 'srl'} dimmed={pick === 'pfa'} />
          </div>
          <div className="lg:col-span-4">
            <h3 className="mb-4 font-display text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              {t('legal.requestMap')} {period ? String(period) : ''}
            </h3>
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <CountyChoropleth
                rows={file?.data || []}
                year={period}
                indicator="legal_req_daily"
                height={360}
              />
            </div>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  )
}
