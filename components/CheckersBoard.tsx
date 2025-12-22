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

const BOARD_SIZE = 8

// Responsive label size
const getLabelSize = (squareSize: number) => {
  if (squareSize < 35) return 18 // Very small screens
  if (squareSize < 45) return 20 // Small screens
  return 25 // Normal screens
}

// Responsive square size based on screen width
const getSquareSize = () => {
  if (typeof window === 'undefined') return 70
  const width = window.innerWidth
  // Account for padding (2rem = 32px on each side) and labels (25px * 2)
  const availableWidth = width - 64 - 50 // padding + labels
  const maxSquareSize = Math.floor(availableWidth / 8)
  
  if (width < 640) { // Mobile (iPhone)
    return Math.max(28, Math.min(35, maxSquareSize)) // Minimum 28px, max 35px
  } else if (width < 768) { // Small tablets
    return Math.min(45, maxSquareSize)
  } else if (width < 1024) { // Tablets
    return Math.min(55, maxSquareSize)
  }
  return Math.min(70, maxSquareSize) // Desktop
}

export default function CheckersBoard({ gameId, playerColor, onMove, initialFen }: CheckersBoardProps) {
  const [game, setGame] = useState<CheckersGame>(() => 
    initialFen ? fenToGame(initialFen) : createNewGame()
  )
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [validMoves, setValidMoves] = useState<Square[]>([])
  const [isPlayingAgainstSelf, setIsPlayingAgainstSelf] = useState(false)
  const [squareSize, setSquareSize] = useState(70)

  useEffect(() => {
    if (initialFen) {
      setGame(fenToGame(initialFen))
    }
  }, [initialFen])

  // Update square size on window resize
  useEffect(() => {
    const updateSquareSize = () => {
      setSquareSize(getSquareSize())
    }
    updateSquareSize()
    window.addEventListener('resize', updateSquareSize)
    return () => window.removeEventListener('resize', updateSquareSize)
  }, [])

  // Poll for game updates
  useEffect(() => {
    if (!gameId) return

    let lastFen = initialFen || ''

    const pollGame = async () => {
      try {
        const res = await fetch(`/api/game/${gameId}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        })
        const data = await res.json()
        if (data.game && data.game.fen) {
          const currentFen = data.game.fen
          
          // Always update if FEN changed (opponent made a move)
          if (currentFen !== lastFen) {
            const updatedGame = fenToGame(currentFen)
            setGame(updatedGame)
            lastFen = currentFen
            
            // Clear selection when opponent moves
            setSelectedSquare(null)
            setValidMoves([])
          }
          
          // Check if playing against self
          if (data.game.whitePlayerId === data.game.blackPlayerId) {
            setIsPlayingAgainstSelf(true)
          }
        }
      } catch (error) {
        console.error('Error polling game:', error)
      }
    }

    // Poll every 1 second for faster updates
    const interval = setInterval(pollGame, 1000)
    pollGame() // Initial fetch

    return () => clearInterval(interval)
  }, [gameId, initialFen])

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
          // Optimistically update local state
          setGame(result.newGame)
          setSelectedSquare(null)
          setValidMoves([])
          
          // Send move to server
          if (onMove) {
            onMove(selectedSquare, square)
          }
          
          // Force a refresh after a short delay to get server state
          setTimeout(() => {
            fetch(`/api/game/${gameId}`)
              .then(res => res.json())
              .then(data => {
                if (data.game && data.game.fen) {
                  const serverGame = fenToGame(data.game.fen)
                  setGame(serverGame)
                }
              })
              .catch(err => console.error('Error refreshing after move:', err))
          }, 500)
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
    const pieceSize = Math.max(squareSize * 0.75, 20) // Piece is 75% of square, minimum 20px
    const kingSize = squareSize < 40 ? 'text-lg' : squareSize < 50 ? 'text-xl' : 'text-2xl'
    
    return (
      <motion.div
        initial={false}
        animate={{
          scale: isSelected ? 1.15 : 1,
        }}
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      >
        <div
          className={`rounded-full border-3 shadow-2xl ${
            isSelected ? 'ring-4 ring-yellow-400 ring-opacity-80' : ''
          }`}
          style={{
            width: `${pieceSize}px`,
            height: `${pieceSize}px`,
            backgroundColor: isWhite ? '#FFFFFF' : '#000000',
            borderColor: isWhite ? '#D1D5DB' : '#374151',
            borderWidth: squareSize < 40 ? '2px' : '3px',
            boxShadow: isSelected 
              ? '0 0 0 4px rgba(250, 204, 21, 0.5), 0 4px 12px rgba(0,0,0,0.5)'
              : isWhite
              ? '0 4px 16px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,1)'
              : '0 4px 16px rgba(0,0,0,0.8), inset 0 -2px 4px rgba(0,0,0,0.5)'
          }}
        >
          {piece.type === 'king' && (
            <div className={`w-full h-full flex items-center justify-center ${kingSize} font-bold ${
              isWhite ? 'text-blue-600' : 'text-yellow-400'
            }`}>
              ♔
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const labelSize = getLabelSize(squareSize)
  const boardWidth = BOARD_SIZE * squareSize + labelSize * 2
  const boardHeight = BOARD_SIZE * squareSize + labelSize * 2

  return (
    <div className="relative w-full flex justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-dark rounded-2xl p-3 sm:p-4 lg:p-6 inline-block"
      >
        <div className="relative" style={{ width: boardWidth, height: boardHeight }}>
          {/* Row numbers (left side) */}
          {Array.from({ length: BOARD_SIZE }, (_, row) => (
            <div
              key={`row-${row}`}
              className="absolute flex items-center justify-center text-white font-semibold"
              style={{
                left: 0,
                top: labelSize + row * squareSize,
                width: labelSize,
                height: squareSize,
                fontSize: squareSize < 40 ? '0.75rem' : squareSize < 50 ? '0.875rem' : '1.125rem',
              }}
            >
              {8 - row}
            </div>
          ))}

          {/* Column letters (bottom) */}
          {Array.from({ length: BOARD_SIZE }, (_, col) => (
            <div
              key={`col-${col}`}
              className="absolute flex items-center justify-center text-white font-semibold"
              style={{
                left: labelSize + col * squareSize,
                top: BOARD_SIZE * squareSize + labelSize,
                width: squareSize,
                height: labelSize,
                fontSize: squareSize < 40 ? '0.75rem' : squareSize < 50 ? '0.875rem' : '1.125rem',
              }}
            >
              {String.fromCharCode(104 - col)}
            </div>
          ))}

          {/* Board squares */}
          <div
            className="absolute"
            style={{
              left: labelSize,
              top: labelSize,
              width: BOARD_SIZE * squareSize,
              height: BOARD_SIZE * squareSize,
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
                      left: col * squareSize,
                      top: row * squareSize,
                      width: squareSize,
                      height: squareSize,
                      touchAction: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      zIndex: piece ? 5 : 1,
                    }}
                  >
                    {piece && renderPiece(piece, row, col)}
                    {isValidMove && !piece && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 10 }}>
                        <div 
                          className="rounded-full bg-blue-500 opacity-70"
                          style={{
                            width: `${Math.max(squareSize * 0.2, 8)}px`,
                            height: `${Math.max(squareSize * 0.2, 8)}px`,
                          }}
                        ></div>
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
      <div className="mt-4 glass-dark rounded-xl p-3 sm:p-4 max-w-md">
        <h3 className="text-white font-semibold mb-2 text-sm sm:text-base">Как играть:</h3>
        <ol className="text-gray-300 text-xs sm:text-sm space-y-1 list-decimal list-inside">
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
