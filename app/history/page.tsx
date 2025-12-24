'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, Users, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { toastManager } from '@/components/ui/Toast'

interface Game {
  id: string
  status: string
  whitePlayer: { id: string; username: string }
  blackPlayer: { id: string; username: string }
  endedAt: string | null
  createdAt: string
}

export default function HistoryPage() {
  const router = useRouter()
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login')
          return
        }
        setUser(data.user)
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (!user) return

    fetch('/api/game/history')
      .then(res => res.json())
      .then(data => {
        if (data.games) {
          setGames(data.games)
        }
        setLoading(false)
      })
      .catch(() => {
        toastManager.error('Ошибка загрузки истории')
        setLoading(false)
      })
  }, [user])

  const getResult = (game: Game) => {
    const isWhite = String(game.whitePlayer.id) === String(user?.id)
    if (game.status === 'DRAW') return 'Ничья'
    if (game.status === 'ABANDONED') return 'Прервана'
    if (game.status === 'WHITE_WON') return isWhite ? 'Победа' : 'Поражение'
    if (game.status === 'BLACK_WON') return !isWhite ? 'Победа' : 'Поражение'
    return game.status
  }

  const getResultColor = (game: Game) => {
    const isWhite = String(game.whitePlayer.id) === String(user?.id)
    if (game.status === 'DRAW') return 'text-yellow-400'
    if (game.status === 'ABANDONED') return 'text-gray-400'
    if (game.status === 'WHITE_WON') return isWhite ? 'text-green-400' : 'text-red-400'
    if (game.status === 'BLACK_WON') return !isWhite ? 'text-green-400' : 'text-red-400'
    return 'text-gray-400'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/profile"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Назад
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">История игр</h1>
        </div>

        {games.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-dark rounded-2xl p-8 text-center"
          >
            <p className="text-gray-400">У вас пока нет завершенных игр</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {games.map((game) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => router.push(`/game?id=${game.id}`)}
                className="glass-dark rounded-xl p-4 hover:bg-opacity-50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="text-white font-semibold">
                        {game.whitePlayer.username} vs {game.blackPlayer.username}
                      </div>
                      <div className="text-gray-400 text-sm flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3" />
                        {game.endedAt ? new Date(game.endedAt).toLocaleDateString('ru-RU') : 'Не завершена'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`font-semibold ${getResultColor(game)}`}>
                      {getResult(game)}
                    </div>
                    <button className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition-colors">
                      Просмотр
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

