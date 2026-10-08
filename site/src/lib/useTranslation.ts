'use client'

import { useSettingsContext } from '@/components/providers/SettingsProvider'
import { translations } from './i18n'
import type { Locale } from './types'

export function useTranslation() {
  const { lang } = useSettingsContext()

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[lang]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        // Fallback to English
        value = translations.en
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey]
          } else {
            return key // Return key if not found
          }
        }
        break
      }
    }
    
    return typeof value === 'string' ? value : key
  }

  return { t, lang }
}
