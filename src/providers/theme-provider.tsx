'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'orange' | 'dark' | 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const themes = {
  orange: {
    name: 'Naranja',
    icon: '🟠',
    bg: '#f9fafb',
    bgSecondary: '#ffffff',
    bgTertiary: '#f3f4f6',
    text: '#111827',
    textSecondary: '#6b7280',
    primary: '#FF6B00',
    primaryHover: '#E55D00',
    primaryLight: '#FFF3E0',
    primaryText: '#ffffff',
    accent: '#1a1f36',
    accentHover: '#2d3548',
    border: '#e5e7eb',
    shadow: 'rgba(0,0,0,0.1)',
  },
  dark: {
    name: 'Oscuro',
    icon: '🌙',
    bg: '#0f172a',
    bgSecondary: '#1e293b',
    bgTertiary: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    primary: '#FF6B00',
    primaryHover: '#E55D00',
    primaryLight: '#FF6B0020',
    primaryText: '#ffffff',
    accent: '#FF6B00',
    accentHover: '#E55D00',
    border: '#334155',
    shadow: 'rgba(0,0,0,0.3)',
  },
  light: {
    name: 'Claro',
    icon: '☀️',
    bg: '#ffffff',
    bgSecondary: '#f8fafc',
    bgTertiary: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#64748b',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryLight: '#dbeafe',
    primaryText: '#ffffff',
    accent: '#0f172a',
    accentHover: '#1e293b',
    border: '#e2e8f0',
    shadow: 'rgba(0,0,0,0.08)',
  },
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('orange')

  useEffect(() => {
    const saved = localStorage.getItem('rapidito_theme') as Theme | null
    if (saved && themes[saved]) {
      setThemeState(saved)
    }
  }, [])

  useEffect(() => {
    const t = themes[theme]
    document.documentElement.style.setProperty('--bg', t.bg)
    document.documentElement.style.setProperty('--bg-secondary', t.bgSecondary)
    document.documentElement.style.setProperty('--bg-tertiary', t.bgTertiary)
    document.documentElement.style.setProperty('--text-color', t.text)
    document.documentElement.style.setProperty('--text-secondary', t.textSecondary)
    document.documentElement.style.setProperty('--primary-color', t.primary)
    document.documentElement.style.setProperty('--primary-hover', t.primaryHover)
    document.documentElement.style.setProperty('--primary-light', t.primaryLight)
    document.documentElement.style.setProperty('--accent-color', t.accent)
    document.documentElement.style.setProperty('--border-color', t.border)
    document.documentElement.style.setProperty('--shadow-color', t.shadow)
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('rapidito_theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export { themes }
export type { Theme }
