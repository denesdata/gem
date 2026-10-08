'use client'

import { useTranslation } from '@/lib/useTranslation'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { IframePanel } from '@/components/ui/IframePanel'
import { GEM_HTML_PANELS } from '@/lib/panelHost'
import { publicUrl } from '@/lib/basePath'
import { latestYear, useUnstacked } from '@/lib/useUnstacked'

// Team members data
const teamMembers = [
  { name: 'Szabó Tünde Petra', linkedin: 'https://www.linkedin.com/in/t%C3%BCnde-petra-szab%C3%B3-b101505b/', email: 'petra.szabo@econ.ubbcluj.ro' },
  { name: 'Dézsi-Benyovszki Annamária', linkedin: 'https://www.linkedin.com/in/annam%C3%A1ria-d%C3%A9zsi-benyovszki-93b1505b/' },
  { name: 'Szőcs Izabella', website: 'https://econ.ubbcluj.ro/cv.php?id=684' },
  { name: 'Győrfy Lehel', website: 'https://econ.ubbcluj.ro/cv.php?id=138' },
  { name: 'Benedek Botond', linkedin: 'https://www.linkedin.com/in/botond-benedek-295048238/' },
  { name: 'Csala Dénes', linkedin: 'https://www.linkedin.com/in/csaladenes/', email: 'mail@csaladen.es' },
]

const communicationTeam = [
  { name: 'Răzvan V. Mustață', linkedin: 'https://www.linkedin.com/in/razvan-mustata/' },
  { name: 'Liviu Deceanu', linkedin: 'https://www.linkedin.com/in/liviu-deceanu-57bb241b/' },
  { name: 'Száz Levente', linkedin: 'https://www.linkedin.com/in/leventeszasz/' },
]

const usefulPages = [
  { name: 'Ministry of Labour and Social Solidarity', url: 'https://mmuncii.ro/j33/index.php/ro/' },
  { name: 'The Ministry of Finance', url: 'https://mfinante.gov.ro/ro/web/site' },
  { name: 'The Ministry of Justice', url: 'https://www.just.ro/' },
  { name: 'Chamber of Commerce and Industry of Romania', url: 'https://ccir.ro/' },
  { name: 'State Office for Inventions and Trademarks', url: 'https://osim.ro/' },
  { name: 'Ministry of Economy, Entrepreneurship and Tourism', url: 'http://www.economie.gov.ro/' },
]

const dataSources = [
  { name: 'Global Entrepreneurship Monitor', url: 'https://www.gemconsortium.org/' },
  { name: 'Romanian National Institute of Statistics', url: 'https://insse.ro/cms/ro' },
  { name: 'National Trade Register', url: 'https://www.onrc.ro' },
  { name: 'National Bank of Romania', url: 'https://www.bnr.ro/Home.aspx' },
  { name: 'World Bank', url: 'https://data.worldbank.org/' },
  { name: 'Ministry of Investment and European Projects', url: 'https://mfe.gov.ro/' },
]

export function Footer() {
  const { t } = useTranslation()
  const { lang, theme } = useSettingsContext()
  const { file: aps } = useUnstacked('aps', lang)
  const dataYear = aps ? latestYear(aps.data) : null

  return (
    <footer className="border-t border-[var(--color-border-subtle)] mt-20 bg-[var(--color-bg-secondary)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="gem-kicker mb-4">{t('footer.usefulPages')}</h4>
            <LinkList items={usefulPages} />
          </div>

          <div>
            <h4 className="gem-kicker mb-4">{t('footer.dataSources')}</h4>
            <LinkList items={dataSources} />
          </div>

          <div>
            <h4 className="gem-kicker mb-4">{t('footer.team')}</h4>
            <ul className="border-t border-[var(--color-border-subtle)] text-sm">
              {teamMembers.map((member) => (
                <PersonRow key={member.name} {...member} />
              ))}
            </ul>
          </div>

          <div>
            <h4 className="gem-kicker mb-4">{t('footer.communication')}</h4>
            <ul className="border-t border-[var(--color-border-subtle)] text-sm">
              {communicationTeam.map((member) => (
                <PersonRow key={member.name} {...member} />
              ))}
            </ul>

            <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-4">
              <h5 className="gem-kicker mb-2">{t('footer.citation')}</h5>
              <p className="font-display text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {t('footer.citationText')}, https://econ.ubbcluj.ro/entrepreneurship/
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <IframePanel
              baseUrl={`${GEM_HTML_PANELS}/like.html`}
              title="Social likes"
              height={40}
              passLang={false}
              passTheme={false}
              passColors={false}
              className="w-40"
            />
            <IframePanel
              baseUrl={`${GEM_HTML_PANELS}/like2.html`}
              title="Social likes 2"
              height={40}
              passLang={false}
              passTheme={false}
              passColors={false}
              className="w-40"
            />
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            {t('footer.lastUpdated')} <span className="tabular">APS/NES {dataYear ?? '—'}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-primary)]">
        <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <a href="https://econ.ubbcluj.ro/" target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-80">
            <img
              src={publicUrl(theme === 'dark' ? '/brand/ubb-fsega-mark-light.png' : '/brand/ubb-fsega-mark.png')}
              alt="UBB FSEGA"
              className="h-12 w-auto"
            />
          </a>

          <p className="text-xs text-[var(--color-text-muted)]">
            {t('footer.copyright')} © {new Date().getFullYear()} | Babeș-Bolyai University | FSEGA
          </p>

          <p className="text-xs text-[var(--color-text-muted)]">
            {t('footer.createdWith')}{' '}
            <a href="https://www.csaladen.es/" target="_blank" rel="noopener noreferrer" className="text-primary text-primary-hover">
              Dénes Csala
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function LinkList({ items }: { items: { name: string; url: string }[] }) {
  return (
    <ul className="border-t border-[var(--color-border-subtle)] text-sm">
      {items.map((item) => (
        <li key={item.url} className="border-b border-[var(--color-border-subtle)] py-2">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="leading-snug text-[var(--color-text-secondary)] hover:text-primary transition-colors"
          >
            {item.name}
          </a>
        </li>
      ))}
    </ul>
  )
}

function PersonRow({
  name,
  linkedin,
  email,
  website,
}: {
  name: string
  linkedin?: string
  email?: string
  website?: string
}) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-[var(--color-border-subtle)] py-2">
      <span className="text-[var(--color-text-primary)]">{name}</span>
      <span className="flex shrink-0 gap-3 text-[11px] uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
        {linkedin && (
          <a href={linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-primary" aria-label={`${name} on LinkedIn`}>
            in
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className="hover:text-primary" aria-label={`Email ${name}`}>
            @
          </a>
        )}
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer" className="hover:text-primary" aria-label={`${name} website`}>
            cv
          </a>
        )}
      </span>
    </li>
  )
}
