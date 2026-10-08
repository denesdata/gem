'use client'

import { FormEvent, useState } from 'react'
import { CollapsibleSection, SectionIcons } from '@/components/ui/CollapsibleSection'
import { useTranslation } from '@/lib/useTranslation'
import { GEM_AGENT } from '@/lib/panelHost'

interface AgentRow {
  time?: string
  value?: number | string | null
  country?: string
  type?: string
  [key: string]: string | number | null | undefined
}

interface AgentResponse {
  answer?: string
  sql?: string
  data?: AgentRow[]
  error?: string | null
}

const EXAMPLES = [
  'What is the TEA rate in Romania?',
  'Compare TEA in Romania, Hungary and Poland',
  "What is Romania's NECI score?",
  'What funding opportunities are coming up?',
]

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/\sstyle="[^"]*"/gi, '')
    .replace(/\sstyle='[^']*'/gi, '')
}

export function AssistantSection() {
  const { t } = useTranslation()
  const [query, setQuery] = useState(EXAMPLES[0])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AgentResponse | null>(null)
  const [asked, setAsked] = useState('')

  const ask = async (text: string) => {
    const q = text.trim()
    if (!q || loading) return
    setLoading(true)
    setResult(null)
    setAsked(q)
    try {
      const res = await fetch(`${GEM_AGENT}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, generate_chart: false }),
      })
      const data = (await res.json()) as AgentResponse
      setResult(data)
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : 'Request failed',
        answer: `<p>${t('assistant.error')}</p>`,
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void ask(query)
  }

  const rows = (result?.data || []).slice(0, 8)
  const showCountry = rows.some((row) => row.country)
  const showType = rows.some((row) => row.type)

  return (
    <CollapsibleSection
      id="assistant"
      title={t('sections.assistant')}
      icon={SectionIcons.assistant}
      defaultExpanded
    >
      <div className="gem-plate">
        <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)]">
          <div className="flex min-h-[26rem] flex-col p-6 md:p-10 lg:border-r lg:border-[var(--color-border-subtle)]">
            <p className="gem-kicker">{t('sections.assistant')}</p>
            <p className="mt-3 max-w-[56ch] text-sm leading-relaxed text-[var(--color-text-secondary)]">{t('assistant.blurb')}</p>

            <form onSubmit={onSubmit} className="mt-6 border-y border-[var(--color-border-subtle)]">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={2}
                disabled={loading}
                className="font-display block w-full resize-none bg-transparent py-4 text-xl leading-snug tracking-tight text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none md:text-2xl"
                placeholder={t('assistant.placeholder')}
              />
              <div className="flex items-center justify-end border-t border-[var(--color-border-subtle)] py-3">
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="btn-gem rounded-full px-5 py-2 text-sm disabled:opacity-50"
                >
                  {loading ? t('assistant.asking') : t('assistant.ask')}
                </button>
              </div>
            </form>

            {loading && (
              <div className="mt-8 space-y-3" aria-hidden>
                <div className="h-6 w-2/3 rounded bg-[var(--color-bg-tertiary)] animate-pulse-subtle" />
                <div className="h-3 w-full rounded bg-[var(--color-bg-tertiary)] animate-pulse-subtle" />
                <div className="h-3 w-5/6 rounded bg-[var(--color-bg-tertiary)] animate-pulse-subtle" />
              </div>
            )}

            {result && (
              <div className="gem-quiz-pane mt-8 space-y-5" aria-live="polite">
                {asked && (
                  <h3 className="font-display max-w-[28ch] text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.02em] text-[var(--color-text-primary)]">
                    {asked}
                  </h3>
                )}
                {result.error && !result.answer && (
                  <p className="border-l-2 border-primary pl-4 text-sm leading-relaxed text-[var(--color-text-muted)]">{result.error}</p>
                )}
                {result.answer && (
                  <div
                    className="gem-answer max-w-[62ch] text-sm"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(result.answer) }}
                  />
                )}
                {rows.length > 0 && (
                  <div className="overflow-x-auto border-t border-[var(--color-border-subtle)]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[var(--color-border-subtle)]">
                          <th className="gem-kicker py-2 text-left font-normal">Time</th>
                          <th className="gem-kicker py-2 text-left font-normal">Value</th>
                          {showCountry && <th className="gem-kicker py-2 text-left font-normal">Country</th>}
                          {showType && <th className="gem-kicker py-2 text-left font-normal">Type</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, i) => (
                          <tr key={i} className="border-b border-[var(--color-border-subtle)] last:border-0">
                            <td className="py-2 text-xs tabular text-[var(--color-text-muted)]">{String(row.time || '—').slice(0, 10)}</td>
                            <td className="font-display py-2 text-base font-semibold tabular text-primary">{row.value ?? '—'}</td>
                            {showCountry && <td className="py-2 text-[var(--color-text-secondary)]">{row.country || '—'}</td>}
                            {showType && <td className="py-2 text-[var(--color-text-secondary)]">{row.type || '—'}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {result.sql && (
                  <details className="text-xs text-[var(--color-text-muted)]">
                    <summary className="cursor-pointer hover:text-primary">{t('assistant.sql')}</summary>
                    <pre className="mt-2 overflow-x-auto whitespace-pre-wrap border-l-2 border-[var(--color-border-default)] pl-4 font-mono">{result.sql}</pre>
                  </details>
                )}
              </div>
            )}
          </div>

          <aside className="flex flex-col border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)]/35 p-6 md:p-8 lg:border-t-0 lg:p-10">
            <p className="gem-kicker mb-5">Try asking</p>
            <ol className="border-t border-[var(--color-border-subtle)]">
              {EXAMPLES.map((example, index) => (
                <li key={example} className="border-b border-[var(--color-border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setQuery(example)}
                    aria-pressed={query === example}
                    className={`grid w-full grid-cols-[1.75rem_1fr] items-baseline gap-3 py-3 text-left hover:bg-[var(--color-primary-muted)] ${
                      query === example ? 'text-primary' : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    <span className="tabular text-[11px] text-[var(--color-text-muted)]">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-[13px] leading-snug">{example}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="font-display mt-auto pt-10 text-[3rem] leading-none tracking-tight text-primary/15" aria-hidden>
              GEM
            </p>
          </aside>
        </div>
      </div>
    </CollapsibleSection>
  )
}
