'use client'

import { useEffect } from 'react'
import { useSettingsContext } from '@/components/providers/SettingsProvider'
import {
  notifyParentNavigation,
  openSection,
  resolveSectionId,
} from '@/lib/embedBridge'

/**
 * Listens for gem2 postMessage + ?section= query, opens the matching chapter.
 */
export function EmbedBridge() {
  const { setLang, lang } = useSettingsContext()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const section = resolveSectionId(params.get('section'))
    if (section) {
      const delays = [200, 600, 1200]
      delays.forEach((ms) => window.setTimeout(() => openSection(section), ms))
    }

    const langParam = params.get('lang')
    if (langParam && ['en', 'ro', 'hu'].includes(langParam) && langParam !== lang) {
      setLang(langParam as 'en' | 'ro' | 'hu')
    }
  }, [setLang, lang])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const onMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://gem2.csaladen.es' &&
        event.origin !== 'https://econ.ubbcluj.ro'
      ) {
        return
      }
      const data = event.data || {}
      if (data.type === 'scrollToSection') {
        const id = resolveSectionId(data.section || data.sectionId)
        if (id) openSection(id)
      }
      if (data.type === 'scrollToPanel') {
        const id = resolveSectionId(String(data.panelId ?? data.section ?? ''))
        if (id) openSection(id)
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    notifyParentNavigation(window.location.href)
  }, [lang])

  return null
}
