'use client'

import { useEffect, useRef, useState } from 'react'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { useTranslation } from '@/lib/useTranslation'
import {
  FORM_SNAPSHOT,
  QUIZ_QUESTIONS,
  QUIZ_RESULT,
  type LegalForm,
  type QuizDest,
} from '@/lib/legalQuiz'
import type { Locale } from '@/lib/types'

interface Answer {
  index: number
  side: 'yes' | 'no'
}

export function LegalQuiz({
  onResult,
}: {
  onResult?: (form: LegalForm | null) => void
}) {
  const { lang } = useSettingsContext()
  const { t } = useTranslation()
  const locale = lang as Locale
  const plate = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [result, setResult] = useState<LegalForm | null>(null)
  const [reason, setReason] = useState<string | null>(null)

  const total = QUIZ_QUESTIONS.length
  const question = QUIZ_QUESTIONS[step]
  const filled = result ? answers.length : Math.min(step + 1, total)

  const finish = (form: LegalForm, id: string) => {
    setResult(form)
    setReason(id)
    onResult?.(form)
  }

  const answer = (side: 'yes' | 'no') => {
    if (result || !question) return
    const dest = question[side]
    setAnswers((prev) => [...prev.filter((item) => item.index !== step), { index: step, side }])
    if (dest === 'next') {
      if (step >= total - 1) {
        finish('srl', question.id)
        return
      }
      setStep((prev) => prev + 1)
      return
    }
    finish(dest, question.id)
  }

  const rewind = (index: number) => {
    setAnswers((prev) => prev.filter((item) => item.index < index))
    setStep(index)
    setResult(null)
    setReason(null)
    onResult?.(null)
  }

  const back = () => {
    if (result) {
      const last = answers[answers.length - 1]
      if (last) rewind(last.index)
      return
    }
    const prev = answers[answers.length - 1]
    if (!prev) return
    rewind(prev.index)
  }

  const restart = () => {
    setStep(0)
    setAnswers([])
    setResult(null)
    setReason(null)
    onResult?.(null)
  }

  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
  }, [step, result])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('input, textarea, select, a, [contenteditable="true"]')) return
      const open =
        document.querySelector('#legal button.gem-chapter')?.getAttribute('aria-expanded') === 'true'
      if (!open) return
      if (!plate.current?.contains(target) && target !== document.body) return

      const key = event.key.toLowerCase()
      if (result) {
        if (key === 'backspace') {
          event.preventDefault()
          back()
        }
        return
      }
      if (key === 'y' || key === '1') answer('yes')
      if (key === 'n' || key === '2') answer('no')
      if (key === 'backspace' || key === 'arrowleft') {
        event.preventDefault()
        back()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, step, answers, question])

  const ended = QUIZ_QUESTIONS.find((item) => item.id === reason)
  const rec = result ? QUIZ_RESULT[result] : null
  const canBack = answers.length > 0 || Boolean(result)

  const destCopy = (dest: QuizDest) => {
    if (dest === 'pfa' || dest === 'srl') return dest.toUpperCase()
    const next = String(Math.min(step + 2, total)).padStart(2, '0')
    return `${t('legal.quiz.nextQuestion')} ${next}`
  }

  return (
    <div
      ref={plate}
      className="gem-legal-plate overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-bg-card)]"
    >
      <div className="grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)]">
        <div className="flex min-h-[32rem] flex-col p-6 md:p-10 lg:border-r lg:border-[var(--color-border-subtle)] lg:p-12">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                {t('legal.quiz.label')}
              </p>
              <p className="mt-3 font-display text-[11px] font-medium uppercase tracking-[0.2em] text-primary">
                {result
                  ? t('legal.quiz.verdict')
                  : `${String(step + 1).padStart(2, '0')}  /  ${String(total).padStart(2, '0')}`}
              </p>
            </div>
            {canBack ? (
              <button
                type="button"
                onClick={result ? restart : back}
                className="text-xs font-medium text-[var(--color-text-muted)] hover:text-primary"
              >
                {result ? t('legal.quiz.again') : t('legal.quiz.back')}
              </button>
            ) : null}
          </div>

          <div className="gem-quiz-pips mb-8" aria-hidden>
            {QUIZ_QUESTIONS.map((item, index) => (
              <span
                key={item.id}
                className={`gem-quiz-pip ${index < filled ? 'is-on' : ''} ${!result && index === step ? 'is-now' : ''}`}
              />
            ))}
          </div>
          <p className="sr-only" role="status">
            {result
              ? rec?.title[locale]
              : t('legal.quiz.progress').replace('{n}', String(step + 1)).replace('{total}', String(total))}
          </p>

          {rec && result ? (
            <div key={`result-${result}`} className="gem-quiz-pane flex flex-1 flex-col" role="group" aria-label={rec.title[locale]}>
              <p className="gem-verdict font-display text-[6.5rem] leading-[0.82] tracking-[-0.045em] text-primary md:text-[8.5rem]" aria-hidden>
                {result.toUpperCase()}
              </p>
              <h3
                ref={heading}
                tabIndex={-1}
                className="font-display mt-6 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] outline-none"
              >
                {rec.title[locale]}
              </h3>
              <p className="mt-3 max-w-[48ch] text-[0.9375rem] leading-relaxed text-[var(--color-text-secondary)]">
                {rec.blurb[locale]}
              </p>
              {ended ? (
                <p className="mt-6 max-w-[48ch] border-l-2 border-primary pl-4 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {ended.hint[locale]}
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-3 pt-10">
                <button type="button" onClick={restart} className="btn-gem rounded-full px-5 py-2.5 text-sm">
                  {t('legal.quiz.again')}
                </button>
                <a
                  href={`#legal-${result}`}
                  className="rounded-full border border-[var(--color-border)] px-5 py-2.5 text-sm text-[var(--color-text-secondary)] hover:border-primary hover:text-primary"
                >
                  {t('legal.quiz.readMore')}
                </a>
              </div>
            </div>
          ) : (
            <div
              key={question.id}
              className="gem-quiz-pane flex flex-1 flex-col"
              role="group"
              aria-label={question.question[locale]}
            >
              <h3
                ref={heading}
                tabIndex={-1}
                className="font-display max-w-[22ch] text-[2.05rem] font-semibold leading-[1.06] tracking-[-0.02em] text-[var(--color-text-primary)] outline-none md:text-[2.75rem]"
              >
                {question.question[locale]}
              </h3>
              <p className="mt-5 max-w-[46ch] text-[0.9375rem] leading-[1.65] text-[var(--color-text-muted)]">
                {question.hint[locale]}
                {question.link ? (
                  <>
                    {' '}
                    <a
                      href={question.link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {question.link.label}
                    </a>
                  </>
                ) : null}
              </p>
              <div className="mt-auto grid grid-cols-2 border-t border-[var(--color-border)] pt-0">
                <Choice
                  label={t('legal.quiz.yes')}
                  glyph="Y"
                  dest={destCopy(question.yes)}
                  terminal={question.yes !== 'next'}
                  onClick={() => answer('yes')}
                />
                <Choice
                  label={t('legal.quiz.no')}
                  glyph="N"
                  dest={destCopy(question.no)}
                  terminal={question.no !== 'next'}
                  edge
                  onClick={() => answer('no')}
                />
              </div>
              <p className="mt-4 hidden text-[11px] text-[var(--color-text-muted)] md:block">{t('legal.quiz.keyHint')}</p>
            </div>
          )}
        </div>

        <Docket
          answers={answers}
          result={result}
          step={step}
          locale={locale}
          t={t}
          onRewind={rewind}
        />
      </div>
    </div>
  )
}

function Choice({
  label,
  glyph,
  dest,
  terminal,
  edge,
  onClick,
}: {
  label: string
  glyph: string
  dest: string
  terminal: boolean
  edge?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`gem-choice-lg px-5 py-7 text-left md:px-7 md:py-8 ${edge ? 'border-l border-[var(--color-border)]' : ''}`}
    >
      <span className="block text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-muted)]">{glyph}</span>
      <span className="font-display mt-1 block text-[1.65rem] font-semibold text-[var(--color-text-primary)] md:text-[1.85rem]">
        {label}
      </span>
      <span
        className={`mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] ${
          terminal ? 'text-primary' : 'text-[var(--color-text-muted)]'
        }`}
      >
        <span className="gem-choice-rule h-px w-5 bg-current opacity-40" />
        {dest}
      </span>
    </button>
  )
}

function Docket({
  answers,
  result,
  step,
  locale,
  t,
  onRewind,
}: {
  answers: Answer[]
  result: LegalForm | null
  step: number
  locale: Locale
  t: (key: string) => string
  onRewind: (index: number) => void
}) {
  return (
    <aside className="flex flex-col bg-[var(--color-bg-tertiary)]/35 p-6 md:p-8 lg:p-10" aria-label={t('legal.quiz.trail')}>
      <p className="mb-5 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">{t('legal.quiz.trail')}</p>
      <ol className="border-t border-[var(--color-border-subtle)]">
        {QUIZ_QUESTIONS.map((item, index) => {
          const recorded = answers.find((entry) => entry.index === index)
          const active = !result && !recorded && index === step
          return (
            <li key={item.id} className="border-b border-[var(--color-border-subtle)]">
              {recorded ? (
                <button
                  type="button"
                  onClick={() => onRewind(index)}
                  title={t('legal.quiz.change')}
                  aria-label={`${String(index + 1).padStart(2, '0')}: ${item.short[locale]}. ${recorded.side === 'yes' ? t('legal.quiz.yes') : t('legal.quiz.no')} — ${t('legal.quiz.change')}`}
                  className="gem-docket-row grid w-full grid-cols-[1.75rem_1fr_auto] items-baseline gap-3 py-3 text-left hover:bg-[var(--color-primary-muted)]"
                >
                  <span className="tabular text-[11px] text-[var(--color-text-muted)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[13px] leading-snug text-[var(--color-text-secondary)]">{item.short[locale]}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-primary">
                    {recorded.side === 'yes' ? t('legal.quiz.yes') : t('legal.quiz.no')}
                  </span>
                </button>
              ) : (
                <div className={`grid grid-cols-[1.75rem_1fr] items-center gap-3 py-3 ${active ? 'opacity-100' : 'opacity-40'}`}>
                  <span className="tabular text-[11px] text-[var(--color-text-muted)]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="h-px w-2/3 bg-[var(--color-border-subtle)]" />
                </div>
              )}
            </li>
          )
        })}
      </ol>
      <div className="mt-auto pt-10 font-display text-[3rem] leading-none tracking-tight text-primary/15 md:text-[3.25rem]" aria-hidden>
        <span className={result === 'pfa' ? 'text-primary/35' : result === 'srl' ? 'text-primary/10' : ''}>PFA</span>
        <span className="mx-2 text-[var(--color-text-muted)]/30">/</span>
        <span className={result === 'srl' ? 'text-primary/35' : result === 'pfa' ? 'text-primary/10' : ''}>SRL</span>
      </div>
    </aside>
  )
}

export function LegalFormCard({
  form,
  active,
  dimmed = false,
}: {
  form: LegalForm
  active: boolean
  dimmed?: boolean
}) {
  const { lang } = useSettingsContext()
  const { t } = useTranslation()
  const locale = lang as Locale
  const snap = FORM_SNAPSHOT[form]
  const title = QUIZ_RESULT[form].title[locale]

  return (
    <article
      id={`legal-${form}`}
      className={`rounded-2xl border bg-[var(--color-bg-card)] p-6 transition-[border-color,opacity] ${
        active
          ? 'border-[var(--color-primary)] ring-1 ring-inset ring-[var(--color-primary)]/25'
          : 'border-[var(--color-border)]'
      } ${dimmed ? 'opacity-60 hover:opacity-100' : ''}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="font-display text-4xl font-semibold leading-none tracking-tight text-primary/30">
          {form.toUpperCase()}
        </p>
        {active ? (
          <span className="rounded-full bg-[var(--color-primary-muted)] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
            {t('legal.quiz.fits')}
          </span>
        ) : null}
      </div>
      <h3 className="font-display text-xl font-semibold tracking-tight text-[var(--color-text-primary)]">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{snap.intro[locale]}</p>
      <ul className="mt-5 space-y-1.5 text-sm text-[var(--color-text-primary)]">
        {snap.plus[locale].map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-primary">+</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <ul className="mt-3 space-y-1.5 text-sm text-[var(--color-text-muted)]">
        {snap.minus[locale].map((item) => (
          <li key={item} className="flex gap-2">
            <span>−</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-[var(--color-text-muted)]">{snap.time[locale]}</p>
    </article>
  )
}
