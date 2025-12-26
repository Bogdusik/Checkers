'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, User, Wifi, WifiOff, X, Send } from 'lucide-react'
import { toastManager } from '@/components/ui/Toast'

interface Player {
  id: string
  username: string
  email: string
  isOnline: boolean
  statistics: {
    totalGames: number
    wins: number
    losses: number
  } | null
}

interface PlayerSelectorProps {
  isOpen: boolean
  onClose: () => void
  onSelectPlayer: (playerId: string | null) => void
  currentUserId: string
}

export default function PlayerSelector({ isOpen, onClose, onSelectPlayer, currentUserId }: PlayerSelectorProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchPlayers()
      // Refresh players list every 10 seconds
      const interval = setInterval(fetchPlayers, 10000)
      return () => clearInterval(interval)
    }
  }, [isOpen])

  const fetchPlayers = async () => {
    try {
      const res = await fetch('/api/game/players')
      const data = await res.json()
      if (data.players) {
        setPlayers(data.players)
      }
      setLoading(false)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Error fetching players:', error)
      setLoading(false)
    }
  }

  const handleSelect = (playerId: string | null) => {
    // null means play against self
    onSelectPlayer(playerId)
    onClose()
  }

  const handleInvite = async (playerId: string) => {
    try {
      const res = await fetch('/api/game/invite/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: playerId })
      })
      const data = await res.json()
      
      if (!res.ok) {
        // Server returned an error status
        toastManager.error(data.error || 'Ошибка отправки приглашения')
        if (process.env.NODE_ENV === 'development') {
          console.error('Send invite error:', data.error, 'Status:', res.status)
        }
        return
      }
      
      if (data.invite) {
        toastManager.success(`Приглашение отправлено ${data.invite.toUser.username}`)
        onClose()
      } else {
        toastManager.error(data.error || 'Ошибка отправки приглашения')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error sending invite:', error)
      }
      toastManager.error('Ошибка подключения. Проверьте интернет-соединение.')
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="glass-dark rounded-2xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">Выберите соперника</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 sm:space-y-3">
            {/* Play against self option */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSelect(null)}
              className="p-3 sm:p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500/50 rounded-xl cursor-pointer hover:border-purple-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm sm:text-base">Играть против себя</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">Для тренировки и тестирования</p>
                  </div>
                </div>
                <div className="text-green-400 font-semibold text-lg sm:text-xl">✓</div>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
                />
              </div>
            ) : players.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                Нет других игроков
              </div>
            ) : (
              players.map((player) => (
                <motion.div
                  key={player.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-3 sm:p-4 rounded-xl transition-all ${
                    player.isOnline
                      ? 'bg-blue-500/10 border-2 border-blue-500/30'
                      : 'bg-gray-500/10 border-2 border-gray-500/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => handleSelect(player.id)}
                      className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        player.isOnline ? 'bg-blue-500' : 'bg-gray-600'
                      }`}>
                        <span className="text-white font-bold text-base sm:text-lg">
                          {player.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold text-sm sm:text-base truncate">{player.username}</h3>
                          {player.isOnline ? (
                            <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                          ) : (
                            <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm truncate">
                          Игр: {player.statistics?.totalGames || 0} | 
                          Побед: {player.statistics?.wins || 0} | 
                          Поражений: {player.statistics?.losses || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {player.isOnline && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleInvite(player.id)
                            }}
                            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs sm:text-sm font-semibold flex items-center gap-1"
                            title="Пригласить друга сыграть в матч"
                          >
                            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Пригласить</span>
                          </button>
                          <div className="text-green-400 font-semibold text-xs sm:text-sm">Онлайн</div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

