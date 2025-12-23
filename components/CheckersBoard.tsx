'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'
import { createNewGame, gameToFen, fenToGame, makeMove, getValidMoves, type CheckersGame, type Square } from '@/lib/checkers'

interface CheckersBoardProps {
  gameId: string
  playerColor: 'white' | 'black'
  onMove?: (from: string, to: string) => void
  initialFen?: string
  lastMove?: { from: string; to: string } | null
}

const BOARD_SIZE = 8

const getLabelSize = (squareSize: number) => {
  if (squareSize < 35) return 16
  if (squareSize < 45) return 18
  return 22
}

// Responsive square size based on screen width
const getSquareSize = () => {
  if (typeof window === 'undefined') return 70
  const width = window.innerWidth
  const availableWidth = width - (width < 640 ? 32 : 64) - (width < 640 ? 40 : 50)
  const maxSquareSize = Math.floor(availableWidth / 8)
  
  if (width < 430) { // iPhone 13 Pro - 17 Pro Max (390-430px)
    return Math.max(32, Math.min(40, maxSquareSize))
  } else if (width < 640) {
    return Math.max(35, Math.min(42, maxSquareSize))
  } else if (width < 768) {
    return Math.min(50, maxSquareSize)
  } else if (width < 1024) {
    return Math.min(60, maxSquareSize)
  }
  return Math.min(70, maxSquareSize)
}

export default function CheckersBoard({ gameId, playerColor, onMove, initialFen, lastMove }: CheckersBoardProps) {
  const [game, setGame] = useState<CheckersGame>(() => 
    initialFen ? fenToGame(initialFen) : createNewGame()
  )
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [validMoves, setValidMoves] = useState<Square[]>([])
  const [isPlayingAgainstSelf, setIsPlayingAgainstSelf] = useState(false)
  const [squareSize, setSquareSize] = useState(70)
  const lastFenRef = useRef<string>(initialFen || '')
  // Protect against visual "bounce back" when server responds a tick later with stale FEN
  const pendingFenRef = useRef<string | null>(null)
  const pendingUntilRef = useRef<number>(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const visibilityListenerSetRef = useRef(false)

  // Memoize valid moves for current selection + game snapshot
  const memoizedValidMoves = useMemo(() => {
    if (!selectedSquare) return []
    return getValidMoves(game, selectedSquare)
  }, [game, selectedSquare])

  useEffect(() => {
    if (initialFen && initialFen !== lastFenRef.current) {
      const updatedGame = fenToGame(initialFen)
      setGame(updatedGame)
      lastFenRef.current = initialFen
      // Reset any pending optimistic state when server pushes a newer FEN
      pendingFenRef.current = null
      pendingUntilRef.current = 0
      // Clear selection when game state changes from parent
      setSelectedSquare(null)
      setValidMoves([])
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

  // Subscribe via SSE; fallback to rare polling if stream drops
  useEffect(() => {
    if (!gameId) return

    let isMounted = true
    let fallbackInterval: NodeJS.Timeout | null = null

    const handleServerState = (payload: any) => {
      if (!payload) return
      const currentFen = payload.fen
      if (currentFen) {
        const now = Date.now()
        if (
          pendingFenRef.current &&
          now < pendingUntilRef.current &&
          currentFen !== pendingFenRef.current &&
          currentFen === lastFenRef.current
        ) {
          return
        }

        if (pendingFenRef.current && currentFen === pendingFenRef.current) {
          pendingFenRef.current = null
          pendingUntilRef.current = 0
        }

        if (currentFen !== lastFenRef.current) {
          const updatedGame = fenToGame(currentFen)
          setGame(updatedGame)
          lastFenRef.current = currentFen
          setSelectedSquare(null)
          setValidMoves([])
        }
      }

      if (payload.game && payload.game.whitePlayerId && payload.game.blackPlayerId) {
        if (String(payload.game.whitePlayerId) === String(payload.game.blackPlayerId)) {
          setIsPlayingAgainstSelf(true)
        }
      }
    }

    const attachSse = () => {
      const es = new EventSource(`/api/game/${gameId}/stream`)
      eventSourceRef.current = es

      es.onmessage = (event) => {
        if (!isMounted) return
        try {
          const payload = JSON.parse(event.data)
          if (!payload) return
          if (payload.type === 'gameState' || payload.type === 'move') {
            handleServerState(payload)
          }
        } catch {
          // ignore malformed
        }
      }

      es.onerror = () => {
        es.close()
        eventSourceRef.current = null

        if (fallbackInterval) clearInterval(fallbackInterval)
        fallbackInterval = setInterval(async () => {
          try {
            const res = await fetch(`/api/game/${gameId}`, { cache: 'no-store' })
            const data = await res.json()
            if (data.game && data.game.fen) {
              handleServerState({ fen: data.game.fen, game: data.game })
            }
          } catch {
            // ignore
          }
        }, 5000)

        setTimeout(() => {
          if (isMounted && !eventSourceRef.current) {
            if (fallbackInterval) {
              clearInterval(fallbackInterval)
              fallbackInterval = null
            }
            attachSse()
          }
        }, 2000)
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !eventSourceRef.current) {
        attachSse()
      }
    }

    if (!visibilityListenerSetRef.current && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility)
      visibilityListenerSetRef.current = true
    }

    attachSse()

    return () => {
      isMounted = false
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (fallbackInterval) clearInterval(fallbackInterval)
      if (visibilityListenerSetRef.current && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility)
        visibilityListenerSetRef.current = false
      }
    }
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

    // Check if it's player's turn first
    if (!isPlayingAgainstSelf && game.currentPlayer !== playerColor) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Not player turn:', { currentPlayer: game.currentPlayer, playerColor, isPlayingAgainstSelf })
      }
      if (selectedSquare) {
        setSelectedSquare(null)
        setValidMoves([])
      }
      return
    }

    const piece = game.board.get(square)
    
    // When playing against self, allow moving any piece on current player's turn
    const canMoveThisColor = isPlayingAgainstSelf 
      ? piece?.color === game.currentPlayer
      : piece?.color === playerColor && game.currentPlayer === playerColor

    // If clicking on own piece (or current player's piece when playing against self), select it
    if (piece && canMoveThisColor) {
      setSelectedSquare(square)
      const moves = getValidMoves(game, square)
      setValidMoves(moves)
      return
    }

    // If a piece is selected, try to move
    if (selectedSquare) {
      if (memoizedValidMoves.includes(square)) {
        const result = makeMove(game, selectedSquare, square)
        if (result.success) {
          // Optimistically update local state and mark pending to avoid bounce back
          const newFen = gameToFen(result.newGame)
          pendingFenRef.current = newFen
          pendingUntilRef.current = Date.now() + 1500 // 1.5s grace window
          setGame(result.newGame)
          lastFenRef.current = newFen // Update ref immediately
          setSelectedSquare(null)
          setValidMoves([])
          
          // Send move to server
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
    const pieceSize = Math.max(squareSize * 0.75, 24)
    const kingSize = squareSize < 40 ? 'text-lg' : squareSize < 50 ? 'text-xl' : 'text-2xl'
    
    return (
      <motion.div
        initial={false}
        animate={{ scale: isSelected ? 1.15 : 1 }}
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
      >
        <div
          className={`rounded-full shadow-2xl ${isSelected ? 'ring-4 ring-yellow-400 ring-opacity-80' : ''}`}
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
          {Array.from({ length: BOARD_SIZE }, (_, row) => (
            <div
              key={`row-${row}`}
              className="absolute flex items-center justify-center text-white font-semibold"
              style={{
                left: 0,
                top: labelSize + row * squareSize,
                width: labelSize,
                height: squareSize,
                fontSize: squareSize < 40 ? '0.7rem' : squareSize < 50 ? '0.8rem' : '1rem',
              }}
            >
              {8 - row}
            </div>
          ))}
          {Array.from({ length: BOARD_SIZE }, (_, col) => (
            <div
              key={`col-${col}`}
              className="absolute flex items-center justify-center text-white font-semibold"
              style={{
                left: labelSize + col * squareSize,
                top: BOARD_SIZE * squareSize + labelSize,
                width: squareSize,
                height: labelSize,
                fontSize: squareSize < 40 ? '0.7rem' : squareSize < 50 ? '0.8rem' : '1rem',
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
                const isValidMove = memoizedValidMoves.includes(square)
                const isSelected = selectedSquare === square
                const isLastMoveFrom = lastMove?.from === square
                const isLastMoveTo = lastMove?.to === square
                const isLastMove = isLastMoveFrom || isLastMoveTo

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
                    } ${
                      isLastMove ? 'ring-2 ring-green-400 ring-opacity-90' : ''
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
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <div 
                          className="rounded-full bg-blue-500 opacity-70"
                          style={{
                            width: `${Math.max(squareSize * 0.2, 10)}px`,
                            height: `${Math.max(squareSize * 0.2, 10)}px`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
