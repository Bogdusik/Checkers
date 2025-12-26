'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import CheckersBoard from '@/components/game/CheckersBoard'
import MoveHistory from '@/components/game/MoveHistory'
import DrawOffer from '@/components/game/DrawOffer'
import GameTimer from '@/components/game/GameTimer'
import GameChat from '@/components/game/GameChat'
import { LogOut, Users, Clock, Trophy, ArrowLeft, Flag, Minus } from 'lucide-react'
import Link from 'next/link'
import { toastManager } from '@/components/ui/Toast'

function GameContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const gameId = searchParams.get('id')
  
  const [user, setUser] = useState<any>(null)
  const [game, setGame] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white')
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    
    fetch('/api/auth/me', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (!data.user) {
          router.push('/login')
          return
        }
        setUser(data.user)
      })
      .catch(() => router.push('/login'))
      .finally(() => clearTimeout(timeoutId))
  }, [router])

  useEffect(() => {
    if (!gameId || !user) return

    let isMounted = true
    let pollInterval = 2000
    let intervalId: NodeJS.Timeout

    const fetchGame = async () => {
      if (!isMounted) return
      
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(`/api/game/${gameId}`, { 
          signal: controller.signal,
          cache: 'no-store' 
        })
        clearTimeout(timeoutId)
        
        if (!isMounted) return
        
        if (res.status === 401) {
          clearInterval(intervalId)
          router.push('/login')
          return
        }
        
        if (res.status === 403 || res.status === 404) {
          clearInterval(intervalId)
          router.push('/')
          return
        }
        
        if (res.status >= 500) {
          pollInterval = Math.min(pollInterval * 1.5, 10000)
          clearInterval(intervalId)
          intervalId = setInterval(fetchGame, pollInterval)
          return
        }
        
        if (pollInterval > 2000) {
          pollInterval = 2000
          clearInterval(intervalId)
          intervalId = setInterval(fetchGame, pollInterval)
        }
        
        const data = await res.json()
        if (data.game && isMounted) {
          setGame(data.game)
          
          if (data.game.moves?.length > 0) {
            const lastMove = data.game.moves[data.game.moves.length - 1].move
            if (lastMove) {
              const [from, to] = lastMove.split('-')
              setLastMove({ from, to })
            }
          }
          
          const isWhite = String(data.game.whitePlayerId) === String(user.id)
          const isBlack = String(data.game.blackPlayerId) === String(user.id)
          setPlayerColor(isWhite ? 'white' : isBlack ? 'black' : 'white')
          setLoading(false)
        }
      } catch {
        pollInterval = Math.min(pollInterval * 1.5, 10000)
        clearInterval(intervalId)
        intervalId = setInterval(fetchGame, pollInterval)
        if (isMounted) setLoading(false)
      }
    }

    fetchGame()
    intervalId = setInterval(fetchGame, pollInterval)
    
    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [gameId, user, router])

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
        toastManager.error(errorData.error || 'Ошибка хода')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error making move:', error)
      toastManager.error('Ошибка выполнения хода')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  const handleResign = async () => {
    if (!gameId) return
    
    // Use a more user-friendly confirmation
    const confirmed = window.confirm('Вы уверены, что хотите сдаться? Игра будет завершена.')
    if (!confirmed) return

    try {
      const res = await fetch(`/api/game/${gameId}/resign`, {
        method: 'POST'
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.game) {
          setGame(data.game)
          toastManager.info('Вы сдались. Игра завершена.')
          // Refresh user stats
          fetch('/api/auth/me')
            .then(res => res.json())
            .then(userData => {
              if (userData.user) {
                setUser(userData.user)
              }
            })
            .catch(() => {})
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Ошибка при сдаче' }))
        toastManager.error(errorData.error || 'Ошибка при сдаче')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error resigning:', error)
      toastManager.error('Ошибка при сдаче')
    }
  }

  const handleOfferDraw = async () => {
    if (!gameId) return

    try {
      const res = await fetch(`/api/game/${gameId}/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'offer' })
      })
      const data = await res.json()
      if (res.ok) {
        toastManager.success('Предложение ничьей отправлено')
        // Refresh game to show draw offer
        const gameRes = await fetch(`/api/game/${gameId}`, { cache: 'no-store' })
        const gameData = await gameRes.json()
        if (gameData.game) {
          setGame(gameData.game)
        }
      } else {
        toastManager.error(data.error || 'Ошибка предложения ничьей')
      }
    } catch (error) {
      toastManager.error('Ошибка предложения ничьей')
    }
  }

  const handleDrawAccepted = () => {
    // Refresh game state
    if (gameId) {
      fetch(`/api/game/${gameId}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => {
          if (data.game) {
            setGame(data.game)
          }
        })
        .catch(() => {})
      
      // Refresh user stats
      fetch('/api/auth/me')
        .then(res => res.json())
        .then(userData => {
          if (userData.user) {
            setUser(userData.user)
          }
        })
        .catch(() => {})
    }
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
                  lastMove={lastMove}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
            {/* Game Info Group */}
            <div className="space-y-3 sm:space-y-4">
              {game.status === 'IN_PROGRESS' && game.drawOfferBy && (
                <DrawOffer
                  gameId={gameId!}
                  drawOfferBy={game.drawOfferBy}
                  currentUserId={user?.id || ''}
                  onDrawAccepted={handleDrawAccepted}
                />
              )}
              
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
                <div className="space-y-3">
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
                          {game.fen?.split(' ')[1] === 'w' ? 'Белые' : 'Черные'}
                        </span>
                      </div>
                    )}
                    {game.status === 'IN_PROGRESS' && game.timeControl && (
                      <div className="text-gray-300">
                        <GameTimer
                          timeLeft={playerColor === 'white' ? game.whiteTimeLeft : game.blackTimeLeft}
                          isActive={game.status === 'IN_PROGRESS' && game.fen?.split(' ')[1] === (playerColor === 'white' ? 'w' : 'b')}
                        />
                      </div>
                    )}
                    {game.status === 'WAITING' && (
                      <div className="text-blue-400 text-xs sm:text-sm">
                        Ожидание второго игрока...
                      </div>
                    )}
                  </div>
                  {game.status === 'IN_PROGRESS' && (
                    <div className="pt-3 border-t border-gray-700 space-y-2">
                      <button
                        onClick={handleOfferDraw}
                        disabled={!!game.drawOfferBy}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border-2 border-yellow-500/50 text-yellow-400 rounded-lg transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                        Предложить ничью
                      </button>
                      <button
                        onClick={handleResign}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 text-red-400 rounded-lg transition-all text-sm font-semibold"
                      >
                        <Flag className="w-4 h-4" />
                        Сдаться
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Game History & Chat Group */}
            <div className="space-y-3 sm:space-y-4">
              {game.moves && game.moves.length > 0 && (
                <MoveHistory 
                  moves={game.moves} 
                  currentPlayer={game.fen?.split(' ')[1] === 'w' ? 'white' : 'black'}
                />
              )}

              {game.status === 'IN_PROGRESS' && (
                <GameChat gameId={gameId!} currentUserId={user?.id || ''} />
              )}
            </div>

            {/* Statistics Group */}
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
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-400 mb-1">Игр</span>
                    <span className="text-white font-semibold text-lg">{user.statistics?.totalGames || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 mb-1">Побед</span>
                    <span className="text-green-400 font-semibold text-lg">{user.statistics?.wins || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 mb-1">Поражений</span>
                    <span className="text-red-400 font-semibold text-lg">{user.statistics?.losses || 0}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 mb-1">Ничьих</span>
                    <span className="text-yellow-400 font-semibold text-lg">{user.statistics?.draws || 0}</span>
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

