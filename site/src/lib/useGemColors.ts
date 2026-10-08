'use client'

import { useEffect, useState } from 'react'

export function useGemColors(): string[] {
  const [colors, setColors] = useState<string[]>([
    '#FF70BB', '#ebbc5a', '#afa2dc', '#99D9EA', '#ffa349', '#7EC844',
  ])

  useEffect(() => {
    const read = () => {
      const computed = getComputedStyle(document.documentElement)
      const next = [1, 2, 3, 4, 5, 6].map(
        (i) => computed.getPropertyValue(`--color-accent-${i}`).trim()
      )
      if (next.every(Boolean)) setColors(next)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-colors', 'class'],
    })
    return () => observer.disconnect()
  }, [])

  return colors
}

export function useThemeToken(name: string, fallback: string) {
  const [value, setValue] = useState(fallback)
  useEffect(() => {
    const read = () => {
      const next = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
      if (next) setValue(next)
    }
    read()
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-colors', 'class'],
    })
    return () => observer.disconnect()
  }, [name])
  return value
}
