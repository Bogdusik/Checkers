/**
 * Checkers game logic
 * Implements Russian checkers rules with support for regular pieces and kings
 * 
 * @module checkers
 */

/**
 * Color of a checkers piece
 */
export type PieceColor = 'white' | 'black'

/**
 * Type of a checkers piece (regular man or promoted king)
 */
export type PieceType = 'man' | 'king'

/**
 * Square notation (e.g., "a1", "b2")
 * Format: letter (a-h) + number (1-8)
 */
export type Square = string

/**
 * Represents a checkers piece
 */
export interface Piece {
  /** Color of the piece */
  color: PieceColor
  /** Type of the piece (man or king) */
  type: PieceType
}

/**
 * Complete game state
 */
export interface CheckersGame {
  /** Board state: map of squares to pieces */
  board: Map<Square, Piece>
  /** Current player whose turn it is */
  currentPlayer: PieceColor
  /** Whether the game has ended */
  gameOver: boolean
  /** Winner of the game (null if game not over or draw) */
  winner: PieceColor | null
}

// Utility functions for square coordinates
const squareToCoords = (square: Square): [number, number] => {
  return [square[0].charCodeAt(0) - 97, parseInt(square[1])]
}

const coordsToSquare = (col: number, row: number): Square => {
  return String.fromCharCode(97 + col) + row
}

const isDarkSquare = (row: number, col: number): boolean => {
  return (row + col) % 2 === 1
}

const isValidSquare = (col: number, row: number): boolean => {
  return col >= 0 && col < 8 && row >= 1 && row <= 8
}

const getDirections = (piece: Piece): number[][] => {
  if (piece.type === 'king') {
    return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  }
  return piece.color === 'white' 
    ? [[-1, 1], [1, 1]]   // White moves up
    : [[-1, -1], [1, -1]] // Black moves down
}

/**
 * Creates a new checkers game with initial board setup
 * 
 * White pieces are placed on rows 1-3 (bottom)
 * Black pieces are placed on rows 6-8 (top)
 * 
 * @returns {CheckersGame} New game state with initial board configuration
 * @example
 * const game = createNewGame()
 * console.log(game.currentPlayer) // 'white'
 * console.log(game.board.size) // 24 (12 white + 12 black)
 */
export function createNewGame(): CheckersGame {
  const board = new Map<Square, Piece>()
  
  // Place white pieces (bottom 3 rows - rows 1, 2, 3)
  for (let row = 1; row <= 3; row++) {
    const startCol = (row % 2 === 0) ? 0 : 1
    for (let col = startCol; col < 8; col += 2) {
      board.set(coordsToSquare(col, row), { color: 'white', type: 'man' })
    }
  }
  
  // Place black pieces (top 3 rows - rows 6, 7, 8)
  for (let row = 6; row <= 8; row++) {
    const startCol = (row % 2 === 0) ? 0 : 1
    for (let col = startCol; col < 8; col += 2) {
      board.set(coordsToSquare(col, row), { color: 'black', type: 'man' })
    }
  }
  
  return {
    board,
    currentPlayer: 'white',
    gameOver: false,
    winner: null
  }
}

/**
 * Converts game state to FEN-like string for storage
 * 
 * Format: "board/board/... currentPlayer gameOver"
 * - Board: rows separated by '/', pieces represented as 'w' (white man), 'W' (white king), 
 *   'b' (black man), 'B' (black king), '-' (empty)
 * - Current player: 'w' or 'b'
 * - Game over: '1' or '0'
 * 
 * @param {CheckersGame} game - Game state to convert
 * @returns {string} FEN string representation
 * @example
 * const game = createNewGame()
 * const fen = gameToFen(game)
 * // Returns something like: "--------/--------/--------/--------/--------/--------/--------/-------- w 0"
 */
export function gameToFen(game: CheckersGame): string {
  const pieces: string[] = []
  for (let row = 8; row >= 1; row--) {
    let rowStr = ''
    for (let col = 0; col < 8; col++) {
      const square = coordsToSquare(col, row)
      const piece = game.board.get(square)
      if (piece) {
        const char = piece.color === 'white' ? 'w' : 'b'
        rowStr += piece.type === 'king' ? char.toUpperCase() : char
      } else {
        rowStr += '-'
      }
    }
    pieces.push(rowStr)
  }
  return pieces.join('/') + ' ' + game.currentPlayer[0] + ' ' + (game.gameOver ? '1' : '0')
}

/**
 * Parses FEN-like string to game state
 * 
 * @param {string} fen - FEN string to parse
 * @returns {CheckersGame} Game state reconstructed from FEN
 * @example
 * const fen = "--------/--------/--------/--------/--------/--------/--------/-------- w 0"
 * const game = fenToGame(fen)
 */
export function fenToGame(fen: string): CheckersGame {
  if (!fen || fen.trim() === '') {
    return createNewGame()
  }
  
  const board = new Map<Square, Piece>()
  const parts = fen.split(' ')
  const boardStr = parts[0]
  const currentPlayer = parts[1] === 'w' ? 'white' : 'black'
  const gameOver = parts[2] === '1'
  
  const rows = boardStr.split('/')
  rows.forEach((row, rowIndex) => {
    const actualRow = 8 - rowIndex
    row.split('').forEach((char, colIndex) => {
      if (char !== '-') {
        const square = coordsToSquare(colIndex, actualRow)
        const isWhite = char.toLowerCase() === 'w'
        const isKing = char === char.toUpperCase()
        board.set(square, { 
          color: isWhite ? 'white' : 'black', 
          type: isKing ? 'king' : 'man' 
        })
      }
    })
  })
  
  return {
    board,
    currentPlayer,
    gameOver,
    winner: gameOver ? (currentPlayer === 'white' ? 'black' : 'white') : null
  }
}

// Check if there are any mandatory captures for the current player
export function hasMandatoryCaptures(game: CheckersGame): boolean {
  for (const [square, piece] of game.board.entries()) {
    if (piece.color === game.currentPlayer) {
      const captures = getCaptures(game, square)
      if (captures.length > 0) {
        return true
      }
    }
  }
  return false
}

/**
 * Gets all valid moves for a piece on a given square
 * 
 * Enforces mandatory capture rule: if any captures are available, only captures are returned
 * 
 * @param {CheckersGame} game - Current game state
 * @param {Square} square - Square to get moves for
 * @returns {Square[]} Array of valid destination squares
 * @example
 * const game = createNewGame()
 * const moves = getValidMoves(game, 'd2')
 * // Returns: ['c3', 'e3'] (diagonal forward moves for white)
 */
export function getValidMoves(game: CheckersGame, square: Square): Square[] {
  const piece = game.board.get(square)
  if (!piece || piece.color !== game.currentPlayer) {
    return []
  }
  
  const [col, row] = squareToCoords(square)
  const captures = getCaptures(game, square)
  const hasAnyCaptures = hasMandatoryCaptures(game)
  
  // If there are mandatory captures, only allow captures
  if (hasAnyCaptures) {
    return captures
  }
  
  // Regular moves (only if no mandatory captures exist)
  const moves: Square[] = []
  const directions = getDirections(piece)
  
  directions.forEach(([dc, dr]) => {
    if (piece.type === 'king') {
      // Kings can move multiple squares diagonally
      for (let distance = 1; distance < 8; distance++) {
        const newCol = col + dc * distance
        const newRow = row + dr * distance
        if (!isValidSquare(newCol, newRow)) break
        
        if (isDarkSquare(newRow - 1, newCol)) {
          const newSquare = coordsToSquare(newCol, newRow)
          if (game.board.has(newSquare)) break
          moves.push(newSquare)
        } else {
          break
        }
      }
    } else {
      // Regular pieces move one square forward
      const newCol = col + dc
      const newRow = row + dr
      if (isValidSquare(newCol, newRow) && isDarkSquare(newRow - 1, newCol)) {
        const newSquare = coordsToSquare(newCol, newRow)
        if (!game.board.has(newSquare)) {
          moves.push(newSquare)
        }
      }
    }
  })
  
  // Add captures if no mandatory captures (optional captures)
  captures.forEach(capture => {
    if (!moves.includes(capture)) {
      moves.push(capture)
    }
  })
  
  return moves
}

// Get capture moves (single-level captures, not recursive)
function getCaptures(game: CheckersGame, square: Square): Square[] {
  const piece = game.board.get(square)
  if (!piece) return []
  
  const [col, row] = squareToCoords(square)
  const captures: Square[] = []
  const directions = getDirections(piece)
  
  directions.forEach(([dc, dr]) => {
    if (piece.type === 'king') {
      // Kings: find first enemy piece, then check if we can jump over it
      let foundEnemy = false
      let enemySquare: Square | null = null
      
      for (let distance = 1; distance < 8; distance++) {
        const checkCol = col + dc * distance
        const checkRow = row + dr * distance
        if (!isValidSquare(checkCol, checkRow)) break
        
        if (isDarkSquare(checkRow - 1, checkCol)) {
          const checkSquare = coordsToSquare(checkCol, checkRow)
          const checkPiece = game.board.get(checkSquare)
          
          if (checkPiece) {
            if (checkPiece.color !== piece.color && !foundEnemy) {
              foundEnemy = true
              enemySquare = checkSquare
            } else {
              break // Hit own piece or second piece
            }
          }
        } else {
          break
        }
      }
      
      // Check if we can jump over the enemy
      if (foundEnemy && enemySquare) {
        const [enemyCol, enemyRow] = squareToCoords(enemySquare)
        const jumpCol = enemyCol + dc
        const jumpRow = enemyRow + dr
        
        if (isValidSquare(jumpCol, jumpRow) && isDarkSquare(jumpRow - 1, jumpCol)) {
          const jumpSquare = coordsToSquare(jumpCol, jumpRow)
          if (!game.board.has(jumpSquare)) {
            captures.push(jumpSquare)
          }
        }
      }
    } else {
      // Regular pieces: jump one square
      const jumpCol = col + dc * 2
      const jumpRow = row + dr * 2
      const middleCol = col + dc
      const middleRow = row + dr
      
      if (isValidSquare(jumpCol, jumpRow) && isDarkSquare(jumpRow - 1, jumpCol)) {
        const middleSquare = coordsToSquare(middleCol, middleRow)
        const jumpSquare = coordsToSquare(jumpCol, jumpRow)
        const middlePiece = game.board.get(middleSquare)
        
        if (middlePiece && middlePiece.color !== piece.color && !game.board.has(jumpSquare)) {
          captures.push(jumpSquare)
        }
      }
    }
  })
  
  return captures
}

// Execute a single capture move (helper for makeMove)
function executeCapture(board: Map<Square, Piece>, from: Square, to: Square, piece: Piece): void {
  const [fromCol, fromRow] = squareToCoords(from)
  const [toCol, toRow] = squareToCoords(to)
  const colDiff = toCol - fromCol
  const rowDiff = toRow - fromRow
  
  if (piece.type === 'king') {
    // King captures: remove all enemy pieces between from and to
    const colStep = colDiff > 0 ? 1 : -1
    const rowStep = rowDiff > 0 ? 1 : -1
    const distance = Math.abs(colDiff)
    
    for (let i = 1; i < distance; i++) {
      const checkCol = fromCol + colStep * i
      const checkRow = fromRow + rowStep * i
      const checkSquare = coordsToSquare(checkCol, checkRow)
      const checkPiece = board.get(checkSquare)
      
      if (checkPiece && checkPiece.color !== piece.color) {
        board.delete(checkSquare)
      }
    }
  } else {
    // Regular piece: capture is always one square away
    const middleCol = (fromCol + toCol) / 2
    const middleRow = (fromRow + toRow) / 2
    board.delete(coordsToSquare(middleCol, middleRow))
  }
}

// Check if piece can promote to king
function checkPromotion(piece: Piece, row: number): PieceType {
  if (piece.type === 'man') {
    if (piece.color === 'white' && row === 8) return 'king'
    if (piece.color === 'black' && row === 1) return 'king'
  }
  return piece.type
}

/**
 * Makes a move in the game
 * 
 * Validates the move, executes captures if needed, promotes pieces to kings,
 * and checks for game over conditions (no pieces left or no valid moves)
 * 
 * @param {CheckersGame} game - Current game state
 * @param {Square} from - Source square
 * @param {Square} to - Destination square
 * @returns {{ success: boolean; newGame: CheckersGame }} Result with success flag and new game state
 * @example
 * const game = createNewGame()
 * const result = makeMove(game, 'd2', 'c3')
 * if (result.success) {
 *   console.log(result.newGame.currentPlayer) // 'black'
 * }
 */
export function makeMove(game: CheckersGame, from: Square, to: Square): { success: boolean; newGame: CheckersGame } {
  const piece = game.board.get(from)
  if (!piece || piece.color !== game.currentPlayer) {
    return { success: false, newGame: game }
  }
  
  const validMoves = getValidMoves(game, from)
  if (!validMoves.includes(to)) {
    return { success: false, newGame: game }
  }
  
  const newBoard = new Map(game.board)
  newBoard.delete(from)
  
  const [toCol, toRow] = squareToCoords(to)
  const [fromCol, fromRow] = squareToCoords(from)
  const isCapture = Math.abs(toCol - fromCol) >= 2 || Math.abs(toRow - fromRow) >= 2
  
  // Execute capture if needed
  if (isCapture) {
    executeCapture(newBoard, from, to, piece)
  }
  
  // Check for promotion
  const newType = checkPromotion(piece, toRow)
  
  // Place piece at destination
  newBoard.set(to, { color: piece.color, type: newType })
  
  // Check for game over (no pieces left or no valid moves)
  const opponentColor = game.currentPlayer === 'white' ? 'black' : 'white'
  const opponentPieces = Array.from(newBoard.values()).filter(p => p.color === opponentColor)
  
  let gameOver = opponentPieces.length === 0
  let winner: PieceColor | null = null
  
  if (!gameOver) {
    // Check if opponent has any valid moves
    const hasValidMoves = Array.from(newBoard.entries()).some(([square, p]) => {
      if (p.color === opponentColor) {
        return getValidMoves({ ...game, board: newBoard, currentPlayer: opponentColor }, square).length > 0
      }
      return false
    })
    
    if (!hasValidMoves) {
      gameOver = true
      winner = game.currentPlayer
    }
  } else {
    winner = game.currentPlayer
  }
  
  const newGame: CheckersGame = {
    board: newBoard,
    currentPlayer: gameOver ? game.currentPlayer : opponentColor,
    gameOver,
    winner
  }
  
  return { success: true, newGame }
}

// Get game status
export function getGameStatus(game: CheckersGame): 'in_progress' | 'white_won' | 'black_won' | 'draw' {
  if (game.gameOver) {
    return game.winner === 'white' ? 'white_won' : 'black_won'
  }
  return 'in_progress'
}

/**
 * Checks if a player of the given color has any valid moves
 * 
 * @param {CheckersGame} game - Current game state
 * @param {PieceColor} color - Color to check moves for
 * @returns {boolean} True if player has at least one valid move
 * @example
 * const game = createNewGame()
 * const hasMoves = hasValidMoves(game, 'white')
 * // Returns: true (white has moves in initial position)
 */
export function hasValidMoves(game: CheckersGame, color: PieceColor): boolean {
  return Array.from(game.board.entries()).some(([square, piece]) => {
    if (piece.color === color) {
      return getValidMoves({ ...game, currentPlayer: color }, square).length > 0
    }
    return false
  })
}

