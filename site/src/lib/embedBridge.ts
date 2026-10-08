/**
 * gem2.csaladen.es (and UBB iframe parent) ↔ gem.csaladen.es child bridge.
 * PDF deep-links stay on gem2 → gem-html; this only handles in-page sections.
 */

export const EMBED_SECTION_ALIASES: Record<string, string> = {
  home: 'overview',
  funding: 'funding',
  start: 'entrepreneurship',
  ro: 'romania',
  romania: 'romania',
  stats: 'statistics',
  statistics: 'statistics',
  aps: 'aps',
  nes: 'nes',
  news: 'reports',
  reports: 'reports',
  about: 'research',
  research: 'research',
  legal: 'legal',
  regional: 'regional',
  trends: 'trends',
  entrepreneurship: 'entrepreneurship',
  overview: 'overview',
  assistant: 'assistant',
}

/** Grafana panel IDs historically posted by gem2 — map to section ids. */
export const LEGACY_PANEL_TO_SECTION: Record<string, string> = {
  '285': 'overview',
  '163': 'funding',
  '171': 'entrepreneurship',
  '161': 'romania',
  '169': 'statistics',
  '179': 'aps',
  '175': 'nes',
  '173': 'reports',
  '66': 'research',
}

export function resolveSectionId(raw: string | null | undefined): string | null {
  if (!raw) return null
  const key = String(raw).replace(/=$/, '').trim()
  if (!key) return null
  if (LEGACY_PANEL_TO_SECTION[key]) return LEGACY_PANEL_TO_SECTION[key]
  return EMBED_SECTION_ALIASES[key.toLowerCase()] || key
}

export function openSection(sectionId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent('gem:open-section', { detail: { id: sectionId } }),
  )
}

export function notifyParentNavigation(url: string) {
  if (typeof window === 'undefined') return
  if (window.parent === window) return
  window.parent.postMessage(
    { type: 'siteNavigation', url },
    'https://gem2.csaladen.es',
  )
  // UBB parent also wraps gem2; harmless if ignored
  try {
    window.parent.parent.postMessage(
      { type: 'siteNavigation', url },
      'https://econ.ubbcluj.ro',
    )
  } catch {
    /* cross-origin chain may throw in some browsers — ignore */
  }
}
