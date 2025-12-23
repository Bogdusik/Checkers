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

    let isMounted = true

    const fetchGame = async () => {
      if (!isMounted) return
      
      try {
        const res = await fetch(`/api/game/${gameId}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })
        
        if (!isMounted) return
        
        const data = await res.json()
        if (data.game && isMounted) {
          setGame(data.game)
          
          // Determine player color - MUST be recalculated every time
          // This is critical - we need to check which player the current user is
          let newPlayerColor: 'white' | 'black' = 'white'
          
          // Use strict comparison and check both IDs
          const isWhitePlayer = String(data.game.whitePlayerId) === String(user.id)
          const isBlackPlayer = String(data.game.blackPlayerId) === String(user.id)
          
          if (isWhitePlayer) {
            newPlayerColor = 'white'
          } else if (isBlackPlayer) {
            newPlayerColor = 'black'
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.error('User is not part of this game:', {
                userId: user.id,
                whitePlayerId: data.game.whitePlayerId,
                blackPlayerId: data.game.blackPlayerId
              })
            }
            // Default to white if user is not found (shouldn't happen)
            newPlayerColor = 'white'
          }
          
          if (isMounted) {
            setPlayerColor(newPlayerColor)
          }
        }
        
        if (isMounted) {
          setLoading(false)
        }
      } catch (error) {
        if (isMounted) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching game:', error)
          }
          setLoading(false)
        }
      }
    }

    fetchGame()
    
    // Poll for game updates every 500ms for very fast synchronization
    const interval = setInterval(() => {
      fetchGame()
    }, 500)
    
    return () => {
      isMounted = false
      clearInterval(interval)
    }
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
        // Immediately update game state after move for instant feedback
        if (data.game) {
          setGame(data.game)
        }
        // Only refresh user stats if game ended
        if (data.game && data.game.status !== 'IN_PROGRESS' && data.game.status !== 'WAITING') {
          fetch('/api/auth/me')
            .then(res => res.json())
            .then(userData => {
              if (userData.user) {
                setUser(userData.user)
              }
            })
            .catch(() => {}) // Silently fail, stats will update on next poll
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Ошибка хода' }))
        alert(errorData.error || 'Ошибка хода')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error making move:', error)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 sm:p-4 flex flex-col">
      <div className="container mx-auto max-w-7xl w-full">
        {/* Header - stays at top */}
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
      </div>

      {/* Main Game Layout - centered vertically */}
      <div className="flex-1 flex items-center justify-center">
        <div className="container mx-auto max-w-7xl w-full">
          <div className="grid lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          <div className="lg:col-span-2 order-2 lg:order-1 flex items-center justify-center">
            {game.status === 'WAITING' && String(game.whitePlayerId) !== String(game.blackPlayerId) ? (
              <div className="glass-dark rounded-2xl p-6 sm:p-12 text-center w-full">
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
              <div className="w-full flex justify-center">
                <CheckersBoard
                  gameId={gameId!}
                  playerColor={playerColor}
                  onMove={(from, to) => handleMove(`${from}-${to}`)}
                  initialFen={game.fen}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
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
                <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                  playerColor === 'white' ? 'bg-blue-500/20 border-2 border-blue-500/50' : 'bg-black/20'
                }`}>
                  <span className="text-white text-sm sm:text-base">Белые</span>
                  <span className="text-gray-300 text-xs sm:text-sm truncate ml-2">
                    {String(game.whitePlayerId) === String(game.blackPlayerId)
                      ? (game.whitePlayer?.username || user?.username || 'Вы')
                      : game.whitePlayer?.username || 'Ожидание...'}
                    {String(game.whitePlayerId) === String(user?.id) && ' (Вы)'}
                  </span>
                </div>
                <div className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                  playerColor === 'black' ? 'bg-blue-500/20 border-2 border-blue-500/50' : 'bg-black/20'
                }`}>
                  <span className="text-white text-sm sm:text-base">Черные</span>
                  <span className="text-gray-300 text-xs sm:text-sm truncate ml-2">
                    {String(game.whitePlayerId) === String(game.blackPlayerId)
                      ? (game.blackPlayer?.username || user?.username || 'Вы')
                      : game.blackPlayer?.username || 'Ожидание...'}
                    {String(game.blackPlayerId) === String(user?.id) && ' (Вы)'}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-700 text-xs text-gray-400">
                  Ваш цвет: <span className="text-white font-semibold">
                    {playerColor === 'white' ? 'Белые' : 'Черные'}
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

