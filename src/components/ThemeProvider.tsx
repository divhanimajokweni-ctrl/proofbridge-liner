'use client'

import { useState, useEffect, useCallback } from 'react'
import { ThemeContext, type Theme } from '@/contexts/ThemeContext'

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vvu-theme') as Theme | null
      if (stored === 'light' || stored === 'dark') {
        queueMicrotask(() => setTheme(stored))
        applyTheme(stored)
      } else {
        applyTheme('dark')
      }
    } catch {
      applyTheme('dark')
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem('vvu-theme', next)
      } catch {}
      applyTheme(next)
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
