'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import CheckersBoard from '@/components/CheckersBoard'
import { LogOut, Users, Clock, Trophy, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function GameContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameId = searchParams.get('id')
  
  const [user, setUser] = useState<any>(null)
  const [game, setGame] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')

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
    if (!gameId || !user) return

    const fetchGame = async () => {
      try {
        const res = await fetch(`/api/game/${gameId}`)
        const data = await res.json()
        if (data.game) {
          setGame(data.game)
          // Determine player color
          if (data.game.whitePlayerId === user.id) {
            setPlayerColor('white')
          } else if (data.game.blackPlayerId === user.id) {
            setPlayerColor('black')
          }
          // If playing against self, allow playing both colors
          // We'll handle this in CheckersBoard by checking if both players are the same
        }
        setLoading(false)
      } catch (error) {
        console.error('Error fetching game:', error)
        setLoading(false)
      }
    }

    fetchGame()
    
    // Poll for game updates every 1 second for faster updates
    const interval = setInterval(() => {
      fetchGame()
    }, 1000)
    
    return () => clearInterval(interval)
  }, [gameId, user])

  const handleMove = async (moveString: string) => {
    if (!gameId || game.status !== 'IN_PROGRESS') return

    try {
      const [from, to] = moveString.split('-')
      const res = await fetch(`/api/game/${gameId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to })
      })
      
      if (res.ok) {
        const data = await res.json()
        // Refresh game state after move
        const gameRes = await fetch(`/api/game/${gameId}`)
        const gameData = await gameRes.json()
        if (gameData.game) {
          setGame(gameData.game)
          // If game ended, refresh user stats
          if (gameData.game.status !== 'IN_PROGRESS' && gameData.game.status !== 'WAITING') {
            const userRes = await fetch('/api/auth/me')
            const userData = await userRes.json()
            if (userData.user) {
              setUser(userData.user)
            }
          }
        }
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Ошибка хода')
      }
    } catch (error) {
      console.error('Error making move:', error)
      alert('Ошибка выполнения хода')
    }
  }

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

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className="text-white text-xl mb-4">Игра не найдена</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            На главную
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Link
              href="/"
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 glass-dark text-white rounded-lg hover:bg-opacity-50 transition-all text-sm sm:text-base"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Назад</span>
            </Link>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Игра в шашки</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 glass-dark text-white rounded-lg hover:bg-opacity-50 transition-all text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Выход</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1">
            {game.status === 'WAITING' && game.whitePlayerId !== game.blackPlayerId ? (
              <div className="glass-dark rounded-2xl p-6 sm:p-12 text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Ожидание соперника</h2>
                <p className="text-gray-300 mb-6 text-sm sm:text-base">Игра начнется, когда присоединится второй игрок</p>
                <div className="flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                  />
                  <span className="text-gray-400 text-sm sm:text-base">Поиск соперника...</span>
                </div>
              </div>
            ) : (
              <CheckersBoard
                gameId={gameId!}
                playerColor={playerColor}
                onMove={(from, to) => handleMove(`${from}-${to}`)}
                initialFen={game.fen}
              />
            )}
          </div>

          <div className="space-y-4 sm:space-y-6 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-dark rounded-2xl p-4 sm:p-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                Игроки
              </h2>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between p-2 sm:p-3 bg-black/20 rounded-lg">
                  <span className="text-white text-sm sm:text-base">Белые</span>
                  <span className="text-gray-300 text-xs sm:text-sm truncate ml-2">
                    {game.whitePlayerId === game.blackPlayerId 
                      ? (game.whitePlayer?.username || user?.username || 'Вы')
                      : game.whitePlayer?.username || 'Ожидание...'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 sm:p-3 bg-black/20 rounded-lg">
                  <span className="text-white text-sm sm:text-base">Черные</span>
                  <span className="text-gray-300 text-xs sm:text-sm truncate ml-2">
                    {game.whitePlayerId === game.blackPlayerId 
                      ? (game.blackPlayer?.username || user?.username || 'Вы')
                      : game.blackPlayer?.username || 'Ожидание...'}
                  </span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-dark rounded-2xl p-4 sm:p-6"
            >
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                Статус игры
              </h2>
              <div className="space-y-2 text-sm sm:text-base">
                <div className="text-gray-300">
                  Статус: <span className="text-white font-semibold">
                    {game.status === 'WAITING' ? 'Ожидание соперника' : 
                     game.status === 'IN_PROGRESS' ? 'В процессе' :
                     game.status === 'WHITE_WON' ? 'Белые победили' :
                     game.status === 'BLACK_WON' ? 'Черные победили' :
                     game.status === 'DRAW' ? 'Ничья' : game.status}
                  </span>
                </div>
                {game.status === 'IN_PROGRESS' && game.fen && (
                  <div className="text-gray-300">
                    Ход: <span className="text-white font-semibold">
                      {game.fen.split(' ')[1] === 'w' ? 'Белые' : 'Черные'}
                    </span>
                  </div>
                )}
                {game.status === 'WAITING' && (
                  <div className="text-blue-400 text-xs sm:text-sm mt-2">
                    Ожидание второго игрока...
                  </div>
                )}
              </div>
            </motion.div>

            {user?.statistics && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-dark rounded-2xl p-4 sm:p-6"
              >
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                  Ваша статистика
                </h2>
                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Игр:</span>
                    <span className="text-white font-semibold">{user.statistics.totalGames}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Побед:</span>
                    <span className="text-green-400 font-semibold">{user.statistics.wins}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Поражений:</span>
                    <span className="text-red-400 font-semibold">{user.statistics.losses}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Ничьих:</span>
                    <span className="text-yellow-400 font-semibold">{user.statistics.draws}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    }>
      <GameContent />
    </Suspense>
  )
}

