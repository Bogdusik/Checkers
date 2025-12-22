'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Gamepad2, Trophy, TrendingUp } from 'lucide-react'
import PlayerSelector from '@/components/PlayerSelector'
import GameInviteNotification from '@/components/GameInviteNotification'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [showPlayerSelector, setShowPlayerSelector] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {})
  }, [])

  // Poll for accepted invites (when someone accepts your invite)
  useEffect(() => {
    if (!user) return

    const checkAcceptedInvite = async () => {
      try {
        const res = await fetch('/api/game/invite/check', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        const data = await res.json()
        if (data.hasGame && data.gameId) {
          // Navigate to the game
          router.push(`/game?id=${data.gameId}`)
        }
      } catch (error) {
        // Silently fail
      }
    }

    // Check immediately and then every 2 seconds
    checkAcceptedInvite()
    const interval = setInterval(checkAcceptedInvite, 2000)

    return () => clearInterval(interval)
  }, [user, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8 sm:mb-12 lg:mb-16"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="inline-block mb-4 sm:mb-6"
          >
            <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-white" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Online Checkers
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-300 px-4">
            Играйте в шашки онлайн с друзьями
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-dark rounded-2xl p-4 sm:p-6 hover:glow-hover transition-all"
          >
            <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-blue-400 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Онлайн игра</h3>
            <p className="text-gray-400 text-sm sm:text-base">Играйте в шашки в реальном времени с друзьями</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-dark rounded-2xl p-4 sm:p-6 hover:glow-hover transition-all"
          >
            <Trophy className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-yellow-400 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Статистика</h3>
            <p className="text-gray-400 text-sm sm:text-base">Отслеживайте свой прогресс и рейтинг</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-dark rounded-2xl p-4 sm:p-6 hover:glow-hover transition-all sm:col-span-2 lg:col-span-1"
          >
            <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-green-400 mb-3 sm:mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Развитие</h3>
            <p className="text-gray-400 text-sm sm:text-base">Улучшайте свои навыки с каждой игрой</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center px-4"
        >
          {user ? (
            <>
              <button
                onClick={() => setShowPlayerSelector(true)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg glow text-sm sm:text-base"
              >
                Найти игру
              </button>
              <Link
                href="/profile"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 glass-dark text-white font-semibold rounded-xl hover:bg-opacity-50 transition-all transform hover:scale-105 text-center text-sm sm:text-base"
              >
                Мой профиль
              </Link>
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:from-red-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  Админ панель
                </Link>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all transform hover:scale-105 shadow-lg glow text-sm sm:text-base text-center"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 glass-dark text-white font-semibold rounded-xl hover:bg-opacity-50 transition-all transform hover:scale-105 text-center text-sm sm:text-base"
              >
                Регистрация
              </Link>
            </>
          )}
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
        
        {user && <GameInviteNotification userId={user.id} />}
      </div>
    </div>
  )
}

