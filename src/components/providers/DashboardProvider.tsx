'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'dark' | 'light'

interface DashboardContextType {
  workspaceId: string
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  selectedCategory: string | null
  setSelectedCategory: (category: string | null) => void
  theme: Theme
  toggleTheme: () => void
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children, workspaceId }: { children: React.ReactNode; workspaceId: string }) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const date = new Date()
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return `${months[date.getMonth()]} ${date.getFullYear()}`
  })
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    // Initialize theme from localStorage or system preference
    const storedTheme = localStorage.getItem('theme') as Theme | null
    if (storedTheme) {
      setTheme(storedTheme)
      if (storedTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } else {
      // Default to dark
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', newTheme)
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      return newTheme
    })
  }

  const contextValue = React.useMemo(() => ({
    workspaceId,
    selectedMonth,
    setSelectedMonth,
    selectedCategory,
    setSelectedCategory,
    theme,
    toggleTheme,
  }), [workspaceId, selectedMonth, selectedCategory, theme])

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboardContext() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider')
  }
  return context
}
