'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Calendar, LogOut, ArrowLeft, Shield } from 'lucide-react'
import PlayerSelector from '@/components/PlayerSelector'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login')
          return
        }
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        router.push('/login')
      })
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  if (!user) return null

  const winRate = user.statistics?.totalGames > 0
    ? ((user.statistics.wins / user.statistics.totalGames) * 100).toFixed(1)
    : '0'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4 flex flex-col">
      <div className="container mx-auto max-w-4xl w-full">
        {/* Header - stays at top */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            На главную
          </Link>
          {user.isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 sm:px-4 py-2 glass-dark text-white rounded-lg hover:bg-opacity-50 transition-all text-sm sm:text-base"
            >
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              Админ панель
            </Link>
          )}
        </div>
      </div>

      {/* Main content - centered vertically */}
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto max-w-4xl w-full">
          <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6"
        >
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold text-white">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">{user.username}</h1>
              <p className="text-gray-400 text-sm sm:text-base">{user.email}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/20 rounded-xl p-4 sm:p-6"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                <h3 className="text-lg sm:text-xl font-semibold text-white">Статистика</h3>
              </div>
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-400">Всего игр:</span>
                  <span className="text-white font-semibold">{user.statistics?.totalGames || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Побед:</span>
                  <span className="text-green-400 font-semibold">{user.statistics?.wins || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Поражений:</span>
                  <span className="text-red-400 font-semibold">{user.statistics?.losses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Ничьих:</span>
                  <span className="text-yellow-400 font-semibold">{user.statistics?.draws || 0}</span>
                </div>
                <div className="pt-2 sm:pt-3 border-t border-gray-700">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Процент побед:</span>
                    <span className="text-blue-400 font-bold text-base sm:text-lg">{winRate}%</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/20 rounded-xl p-4 sm:p-6"
            >
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                <h3 className="text-lg sm:text-xl font-semibold text-white">Дополнительно</h3>
              </div>
              <div className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <div className="flex justify-between">
                  <span className="text-gray-400">Всего ходов:</span>
                  <span className="text-white font-semibold">{user.statistics?.totalMoves || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Среднее время игры:</span>
                  <span className="text-white font-semibold">
                    {user.statistics?.averageGameTime ? `${Math.floor(user.statistics.averageGameTime / 60)} мин` : 'N/A'}
                  </span>
                </div>
                <div className="pt-2 sm:pt-3 border-t border-gray-700">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">
                      Последний вход: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ru-RU') : 'Никогда'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
            <button
              onClick={() => setShowPlayerSelector(true)}
              className="flex-1 px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 text-center text-sm sm:text-base"
            >
              Найти игру
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 glass-dark text-white rounded-lg hover:bg-opacity-50 transition-all text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              Выход
            </button>
          </div>
        </motion.div>

        <PlayerSelector
          isOpen={showPlayerSelector}
          onClose={() => setShowPlayerSelector(false)}
          onSelectPlayer={async (opponentId) => {
            try {
              const res = await fetch('/api/game/create-with-opponent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opponentId })
              })
              const data = await res.json()
              if (data.game) {
                router.push(`/game?id=${data.game.id}`)
              } else {
                alert('Ошибка создания игры')
              }
            } catch (error) {
              console.error('Error creating game:', error)
              alert('Ошибка создания игры')
            }
          }}
          currentUserId={user?.id || ''}
        />
        </div>
      </div>
    </div>
  )
}

