'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export default function ThemeSettings() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    const effectiveTheme = theme === 'system' 
      ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      : theme

    if (effectiveTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  if (!mounted) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-dark rounded-xl p-4"
    >
      <h3 className="text-white font-semibold mb-3">Тема</h3>
      <div className="flex gap-2">
        <button
          onClick={() => setTheme('light')}
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
            theme === 'light' 
              ? 'bg-blue-500/20 border-2 border-blue-500/50' 
              : 'bg-black/20 border-2 border-transparent hover:bg-black/30'
          }`}
        >
          <Sun className="w-5 h-5 text-yellow-400" />
          <span className="text-white text-xs">Светлая</span>
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
            theme === 'dark' 
              ? 'bg-blue-500/20 border-2 border-blue-500/50' 
              : 'bg-black/20 border-2 border-transparent hover:bg-black/30'
          }`}
        >
          <Moon className="w-5 h-5 text-blue-400" />
          <span className="text-white text-xs">Темная</span>
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
            theme === 'system' 
              ? 'bg-blue-500/20 border-2 border-blue-500/50' 
              : 'bg-black/20 border-2 border-transparent hover:bg-black/30'
          }`}
        >
          <Monitor className="w-5 h-5 text-gray-400" />
          <span className="text-white text-xs">Система</span>
        </button>
      </div>
    </motion.div>
  )
}

