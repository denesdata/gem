export const GEM_HTML_PANELS = 'https://gem-html.csaladen.es/panels'
export const GEM_AGENT = 'https://gem-agent.csaladen.es'

/**
 * Panel JSON for the UI.
 * Prefer gem-html static files (CDN-ish httpd). FastAPI mirrors the same
 * files at GEM_AGENT/api/data/panels/{name} for tooling / SQLite joins.
 */
export function panelUrl(file: string): string {
  const name = file.replace(/^\//, '')
  return `${GEM_HTML_PANELS}/${name}`
}

export function dataApiUrl(path: string): string {
  const clean = path.replace(/^\//, '')
  return `${GEM_AGENT}/api/data/${clean}`
}
