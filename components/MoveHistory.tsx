'use client'

import { motion } from 'framer-motion'
import { History } from 'lucide-react'
import { useState } from 'react'

interface Move {
  id: string
  move: string
  moveNumber: number
  createdAt: string
}

interface MoveHistoryProps {
  moves: Move[]
  currentPlayer: 'white' | 'black'
}

export default function MoveHistory({ moves, currentPlayer }: MoveHistoryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatMove = (move: string) => {
    const [from, to] = move.split('-')
    return `${from} → ${to}`
  }

  const groupedMoves = moves.reduce((acc, move, index) => {
    const pairIndex = Math.floor(index / 2)
    if (!acc[pairIndex]) {
      acc[pairIndex] = []
    }
    acc[pairIndex].push(move)
    return acc
  }, [] as Move[][])

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-dark rounded-2xl p-4 sm:p-6"
    >
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-white flex items-center gap-2">
          <History className="w-4 h-4 sm:w-5 sm:h-5" />
          История ходов
        </h2>
        {moves.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? 'Свернуть' : 'Развернуть'}
          </button>
        )}
      </div>
      
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {moves.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-4">
            Ходов пока нет
          </div>
        ) : (
          <div className="space-y-1">
            {groupedMoves.map((pair, pairIndex) => (
              <div key={pairIndex} className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-gray-500 font-mono w-8 flex-shrink-0">
                  {pairIndex + 1}.
                </span>
                <div className="flex gap-2 flex-1">
                  {pair.map((move, moveIndex) => {
                    const isWhiteMove = moveIndex === 0
                    const isCurrentMove = pairIndex === groupedMoves.length - 1 && 
                                       ((isWhiteMove && currentPlayer === 'white') || 
                                        (!isWhiteMove && currentPlayer === 'black'))
                    
                    return (
                      <div
                        key={move.id}
                        className={`flex-1 px-2 py-1 rounded ${
                          isWhiteMove 
                            ? 'bg-white/10 text-white' 
                            : 'bg-black/20 text-gray-300'
                        } ${
                          isCurrentMove ? 'ring-2 ring-blue-400' : ''
                        }`}
                      >
                        <span className="font-mono">{formatMove(move.move)}</span>
                      </div>
                    )
                  })}
                  {pair.length === 1 && (
                    <div className="flex-1 px-2 py-1 rounded bg-gray-800/30 text-gray-600">
                      —
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

