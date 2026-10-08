'use client'

import { useEffect, useRef, useState } from 'react'

interface MatrixRainProps {
  active: boolean
  duration?: number // Duration in ms before fading out
}

export function MatrixRain({ active, duration = 3000 }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [opacity, setOpacity] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const dropsRef = useRef<number[]>([])

  // Handle activation
  useEffect(() => {
    if (active) {
      // Start effect
      setOpacity(0.35)
      
      // Schedule fade out
      const fadeTimer = setTimeout(() => {
        setOpacity(0)
      }, duration - 500)

      return () => clearTimeout(fadeTimer)
    } else {
      setOpacity(0)
    }
  }, [active, duration])

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size to window size
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      // Recalculate drops array
      const fontSize = 14
      const columns = Math.floor(canvas.width / fontSize)
      dropsRef.current = Array(columns).fill(0).map(() => Math.random() * -100)
    }
    resize()
    window.addEventListener('resize', resize)

    // Matrix characters
    const chars = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモャヤュユョヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>{}[]|\\/:;!@#$%^&*()'
    const charArray = chars.split('')
    const fontSize = 14

    // Colors
    const greens = ['#7EC844', '#3D8B70', '#5FA832', '#9AD864', '#2D6B55']

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 15, 20, 0.05)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = `bold ${fontSize}px monospace`

      const drops = dropsRef.current
      for (let i = 0; i < drops.length; i++) {
        const char = charArray[Math.floor(Math.random() * charArray.length)]
        const x = i * fontSize
        const y = drops[i] * fontSize

        if (Math.random() > 0.95) {
          ctx.fillStyle = '#FFFFFF'
          ctx.globalAlpha = 1
        } else if (Math.random() > 0.7) {
          ctx.fillStyle = '#7EC844'
          ctx.globalAlpha = 0.9
        } else {
          ctx.fillStyle = greens[Math.floor(Math.random() * greens.length)]
          ctx.globalAlpha = Math.random() * 0.6 + 0.3
        }

        ctx.fillText(char, x, y)
        ctx.globalAlpha = 1

        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i] += 0.4 + Math.random() * 0.6
      }
    }

    intervalRef.current = setInterval(draw, 50)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Canvas is always rendered but invisible when opacity is 0
  return (
    <canvas
      ref={canvasRef}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
        transition: 'opacity 500ms ease-out',
      }}
    />
  )
}
