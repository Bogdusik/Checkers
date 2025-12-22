'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, User, Wifi, WifiOff, X } from 'lucide-react'

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
      console.error('Error fetching players:', error)
      setLoading(false)
    }
  }

  const handleSelect = (playerId: string | null) => {
    // null means play against self
    onSelectPlayer(playerId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="glass-dark rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">Выберите соперника</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {/* Play against self option */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              onClick={() => handleSelect(null)}
              className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500/50 rounded-xl cursor-pointer hover:border-purple-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Играть против себя</h3>
                    <p className="text-gray-400 text-sm">Для тренировки и тестирования</p>
                  </div>
                </div>
                <div className="text-green-400 font-semibold">✓</div>
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
                  onClick={() => handleSelect(player.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    player.isOnline
                      ? 'bg-blue-500/10 border-2 border-blue-500/30 hover:border-blue-400'
                      : 'bg-gray-500/10 border-2 border-gray-500/30 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        player.isOnline ? 'bg-blue-500' : 'bg-gray-600'
                      }`}>
                        <span className="text-white font-bold text-lg">
                          {player.username[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{player.username}</h3>
                          {player.isOnline ? (
                            <Wifi className="w-4 h-4 text-green-400" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        <p className="text-gray-400 text-sm">
                          Игр: {player.statistics?.totalGames || 0} | 
                          Побед: {player.statistics?.wins || 0} | 
                          Поражений: {player.statistics?.losses || 0}
                        </p>
                      </div>
                    </div>
                    {player.isOnline && (
                      <div className="text-green-400 font-semibold">Онлайн</div>
                    )}
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

