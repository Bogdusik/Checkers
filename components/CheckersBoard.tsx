'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { createNewGame, gameToFen, fenToGame, makeMove, getValidMoves, type CheckersGame, type Square } from '@/lib/checkers'

interface CheckersBoardProps {
  gameId: string
  playerColor: 'white' | 'black'
  onMove?: (from: string, to: string) => void
  initialFen?: string
}

const SQUARE_SIZE = 70
const BOARD_SIZE = 8
const LABEL_SIZE = 25

export default function CheckersBoard({ gameId, playerColor, onMove, initialFen }: CheckersBoardProps) {
  const [game, setGame] = useState<CheckersGame>(() => 
    initialFen ? fenToGame(initialFen) : createNewGame()
  )
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [validMoves, setValidMoves] = useState<Square[]>([])
  const [isPlayingAgainstSelf, setIsPlayingAgainstSelf] = useState(false)

  useEffect(() => {
    if (initialFen) {
      setGame(fenToGame(initialFen))
    }
  }, [initialFen])

  // Poll for game updates
  useEffect(() => {
    if (!gameId) return

    const pollGame = async () => {
      try {
        const res = await fetch(`/api/game/${gameId}`)
        const data = await res.json()
        if (data.game && data.game.fen) {
          const updatedGame = fenToGame(data.game.fen)
          // Only update game state if it's different (to preserve selection)
          setGame(prevGame => {
            // If FEN is the same, don't update to preserve selection
            const newFen = gameToFen(updatedGame)
            const prevFen = gameToFen(prevGame)
            if (newFen === prevFen) {
              return prevGame
            }
            return updatedGame
          })
          // Check if playing against self
          if (data.game.whitePlayerId === data.game.blackPlayerId) {
            setIsPlayingAgainstSelf(true)
          }
        }
      } catch (error) {
        console.error('Error polling game:', error)
      }
    }

    // Poll every 2 seconds
    const interval = setInterval(pollGame, 2000)
    pollGame() // Initial fetch

    return () => clearInterval(interval)
  }, [gameId])

  const isDarkSquare = (row: number, col: number) => {
    return (row + col) % 2 === 1
  }

  const getSquareName = (row: number, col: number): Square => {
    return (String.fromCharCode(97 + col) + (8 - row)) as Square
  }

  const handleSquareClick = (square: Square) => {
    if (game.gameOver) {
      return
    }

    const piece = game.board.get(square)
    
    // When playing against self, allow moving any piece on current player's turn
    const canMoveThisColor = isPlayingAgainstSelf 
      ? piece?.color === game.currentPlayer
      : piece?.color === playerColor && game.currentPlayer === playerColor
    
    // Check if it's player's turn
    if (!isPlayingAgainstSelf && game.currentPlayer !== playerColor) {
      // If clicking on a piece that's not current player's, deselect
      if (selectedSquare) {
        setSelectedSquare(null)
        setValidMoves([])
      }
      return
    }

    // If clicking on own piece (or current player's piece when playing against self), select it
    if (piece && canMoveThisColor) {
      setSelectedSquare(square)
      const moves = getValidMoves(game, square)
      setValidMoves(moves)
      return
    }

    // If a piece is selected, try to move
    if (selectedSquare) {
      if (validMoves.includes(square)) {
        const result = makeMove(game, selectedSquare, square)
        if (result.success) {
          setGame(result.newGame)
          setSelectedSquare(null)
          setValidMoves([])
          
          if (onMove) {
            onMove(selectedSquare, square)
          }
        } else {
          // Move failed, deselect
          setSelectedSquare(null)
          setValidMoves([])
        }
      } else {
        // Deselect if clicking invalid square
        setSelectedSquare(null)
        setValidMoves([])
      }
    }
  }

  const renderPiece = (piece: { color: 'white' | 'black'; type: 'man' | 'king' }, row: number, col: number) => {
    const isSelected = selectedSquare === getSquareName(row, col)
    const isWhite = piece.color === 'white'
    
    return (
      <motion.div
        initial={false}
        animate={{
          scale: isSelected ? 1.15 : 1,
        }}
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      >
        <div
          className={`w-14 h-14 rounded-full border-3 shadow-2xl ${
            isSelected ? 'ring-4 ring-yellow-400 ring-opacity-80' : ''
          }`}
          style={{
            backgroundColor: isWhite ? '#FFFFFF' : '#000000',
            borderColor: isWhite ? '#D1D5DB' : '#374151',
            borderWidth: '3px',
            boxShadow: isSelected 
              ? '0 0 0 4px rgba(250, 204, 21, 0.5), 0 4px 12px rgba(0,0,0,0.5)'
              : isWhite
              ? '0 4px 16px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,1)'
              : '0 4px 16px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {piece.type === 'king' && (
            <div className={`w-full h-full flex items-center justify-center text-2xl font-bold ${
              isWhite ? 'text-blue-600' : 'text-yellow-400'
            }`}>
              ♔
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const boardWidth = BOARD_SIZE * SQUARE_SIZE + LABEL_SIZE * 2
  const boardHeight = BOARD_SIZE * SQUARE_SIZE + LABEL_SIZE * 2

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-dark rounded-2xl p-6 inline-block"
      >
        <div className="relative" style={{ width: boardWidth, height: boardHeight }}>
          {/* Row numbers (left side) */}
          {Array.from({ length: BOARD_SIZE }, (_, row) => (
            <div
              key={`row-${row}`}
              className="absolute flex items-center justify-center text-white font-semibold text-lg"
              style={{
                left: 0,
                top: LABEL_SIZE + row * SQUARE_SIZE,
                width: LABEL_SIZE,
                height: SQUARE_SIZE,
              }}
            >
              {8 - row}
            </div>
          ))}

          {/* Column letters (bottom) */}
          {Array.from({ length: BOARD_SIZE }, (_, col) => (
            <div
              key={`col-${col}`}
              className="absolute flex items-center justify-center text-white font-semibold text-lg"
              style={{
                left: LABEL_SIZE + col * SQUARE_SIZE,
                top: BOARD_SIZE * SQUARE_SIZE + LABEL_SIZE,
                width: SQUARE_SIZE,
                height: LABEL_SIZE,
              }}
            >
              {String.fromCharCode(104 - col)}
            </div>
          ))}

          {/* Board squares */}
          <div
            className="absolute"
            style={{
              left: LABEL_SIZE,
              top: LABEL_SIZE,
              width: BOARD_SIZE * SQUARE_SIZE,
              height: BOARD_SIZE * SQUARE_SIZE,
            }}
          >
            {Array.from({ length: BOARD_SIZE }, (_, row) =>
              Array.from({ length: BOARD_SIZE }, (_, col) => {
                const square = getSquareName(row, col)
                const isDark = isDarkSquare(row, col)
                const piece = game.board.get(square)
                const isValidMove = validMoves.includes(square)
                const isSelected = selectedSquare === square

                return (
                  <div
                    key={`${row}-${col}`}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSquareClick(square)
                    }}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSquareClick(square)
                    }}
                    className={`absolute border border-gray-400 ${
                      isDark ? 'bg-chess-dark' : 'bg-chess-light'
                    } ${
                      isValidMove ? 'ring-2 ring-blue-400 ring-opacity-75' : ''
                    } ${
                      isSelected ? 'ring-4 ring-yellow-400' : ''
                    } transition-all cursor-pointer hover:opacity-90 active:opacity-75`}
                    style={{
                      left: col * SQUARE_SIZE,
                      top: row * SQUARE_SIZE,
                      width: SQUARE_SIZE,
                      height: SQUARE_SIZE,
                      touchAction: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      zIndex: piece ? 5 : 1,
                    }}
                  >
                    {piece && renderPiece(piece, row, col)}
                    {isValidMove && !piece && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                        <div className="w-4 h-4 rounded-full bg-blue-500 opacity-70"></div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </motion.div>
      
      {/* Instructions */}
      <div className="mt-4 glass-dark rounded-xl p-4 max-w-md">
        <h3 className="text-white font-semibold mb-2">Как играть:</h3>
        <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
          <li>Кликните на свою шашку (белую или черную)</li>
          <li>Подсветятся возможные ходы (синие точки)</li>
          <li>Кликните на клетку, куда хотите походить</li>
          <li>Шашки ходят только по диагонали вперед</li>
          <li>Если можно взять шашку противника - это обязательно!</li>
        </ol>
      </div>
    </div>
  )
}
