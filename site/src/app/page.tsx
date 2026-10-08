'use client'

import { useEffect, useState, useRef } from 'react'
import { HeroSection } from '@/components/sections/HeroSection'
import { KeyMetricsSection } from '@/components/sections/KeyMetricsSection'
import { KeyIndicatorsTwo } from '@/components/sections/KeyIndicatorsTwo'
import { GEMResearchSection } from '@/components/sections/GEMResearchSection'
import { RomaniaOverviewSection } from '@/components/sections/RomaniaOverviewSection'
import { ReportsSection } from '@/components/sections/ReportsSection'
import { AssistantSection } from '@/components/sections/AssistantSection'
import { FundingSection } from '@/components/sections/FundingSection'
import { LegalSection } from '@/components/sections/LegalSection'
import { RomaniaMapSection } from '@/components/sections/RomaniaMapSection'
import { APSSection } from '@/components/sections/APSSection'
import { NESSection } from '@/components/sections/NESSection'
import { EntrepreneurshipSection } from '@/components/sections/EntrepreneurshipSection'
import { StatisticsSection } from '@/components/sections/StatisticsSection'
import { TimeSeriesSection } from '@/components/sections/TimeSeriesSection'
import { MatrixRain } from '@/components/ui/MatrixRain'
import { useSettingsContext } from '@/components/providers/SettingsProvider'

export default function HomePage() {
  const { mode, mounted } = useSettingsContext()
  const [matrixActive, setMatrixActive] = useState(false)
  const prevModeRef = useRef(mode)
  
  // Show simple mode by default during SSR/initial render
  const isExpertMode = mounted && mode === 'expert'

  // Trigger matrix effect when switching TO expert mode
  useEffect(() => {
    if (mounted && mode === 'expert' && prevModeRef.current !== 'expert') {
      setMatrixActive(true)
      // Deactivate after duration
      const timer = setTimeout(() => setMatrixActive(false), 3500)
      return () => clearTimeout(timer)
    }
    prevModeRef.current = mode
  }, [mode, mounted])

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Matrix rain background - always rendered, controlled by active prop */}
      <MatrixRain active={matrixActive} duration={3000} />
      {/* Hero Section - Clean branding with key message */}
      <HeroSection />
      
      {/* Key Metrics - THE star of the page: headline numbers at a glance */}
      <KeyMetricsSection />
      <KeyIndicatorsTwo />

      <div className="container mx-auto px-4 space-y-6">
        <AssistantSection />
        {isExpertMode ? (
          <>
            {/* EXPERT MODE: All original sections with full detail */}
            
            {/* Adult Population Survey - Full Section */}
            <APSSection />
            
            {/* National Expert Survey - Full Section */}
            <NESSection />
            
            {/* Romania Map - Geographic visualization */}
            <RomaniaMapSection />
            
            {/* Time Series - Historical trends */}
            <TimeSeriesSection />
            
            {/* Entrepreneurship - Detailed metrics */}
            <EntrepreneurshipSection />
            
            {/* Statistics - Romanian business statistics */}
            <StatisticsSection />
            
            {/* Reports & Publications */}
            <ReportsSection />
          </>
        ) : (
          <>
            {/* SIMPLE MODE: Streamlined, consolidated view */}
            
            {/* GEM Research - Consolidated APS + NES with tabs */}
            <GEMResearchSection />
            
            {/* Romania Overview - Consolidated statistics */}
            <RomaniaOverviewSection />
            
            {/* Reports & Publications - CTA for accessing research */}
            <ReportsSection />
          </>
        )}
        <FundingSection />
        <LegalSection />
      </div>
      
      {!isExpertMode && (
        <div className="container mx-auto px-4 pb-8">
          <p className="gem-kicker mb-3">Resources</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <ResourceLink title="Funding opportunities" description="EU and national programs" href="#funding" />
            <ResourceLink title="Starting a business" description="PFA vs SRL" href="#legal" />
            <ResourceLink title="GEM Global" description="gemconsortium.org" href="https://gemconsortium.org" />
            <ResourceLink title="Contact" description="FSEGA, UBB Cluj-Napoca" href="#contact" />
          </ul>
        </div>
      )}
    </div>
  )
}

function ResourceLink({ title, description, href }: {
  title: string
  description: string
  href: string
}) {
  const isExternal = href.startsWith('http')

  return (
    <li>
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="group inline-flex flex-col"
      >
        <span className="font-medium text-[var(--color-text-primary)] group-hover:text-primary transition-colors">
          {title}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{description}</span>
      </a>
    </li>
  )
}
