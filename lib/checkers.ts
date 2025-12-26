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

// Get directions for regular moves (forward only for men)
const getMoveDirections = (piece: Piece): number[][] => {
  if (piece.type === 'king') {
    return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  }
  return piece.color === 'white' 
    ? [[-1, 1], [1, 1]]   // White moves up
    : [[-1, -1], [1, -1]] // Black moves down
}

// Get directions for captures (all 4 directions for men when capturing)
const getCaptureDirections = (piece: Piece): number[][] => {
  // Both men and kings can capture in all 4 diagonal directions
  return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
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

/**
 * Represents a capture sequence (series of captures)
 */
interface CaptureSequence {
  /** Final destination square after all captures */
  finalSquare: Square
  /** All squares where pieces were captured */
  capturedSquares: Square[]
  /** All intermediate squares visited during capture sequence */
  path: Square[]
  /** Row of final square (needed for promotion check) */
  finalRow: number
}

// Check if there are any mandatory captures for the current player
export function hasMandatoryCaptures(game: CheckersGame): boolean {
  for (const [square, piece] of game.board.entries()) {
    if (piece.color === game.currentPlayer) {
      const sequences = getAllCaptureSequences(game, square)
      if (sequences.length > 0) {
        return true
      }
    }
  }
  return false
}

/**
 * Gets all valid moves for a piece on a given square
 * 
 * Enforces mandatory capture rule: if any captures are available, only captures are returned.
 * Returns final destination squares after all possible capture sequences.
 * 
 * @param {CheckersGame} game - Current game state
 * @param {Square} square - Square to get moves for
 * @returns {Square[]} Array of valid destination squares (final positions after captures)
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
  
  const hasAnyCaptures = hasMandatoryCaptures(game)
  
  // If there are mandatory captures, only return capture sequences
  if (hasAnyCaptures) {
    const sequences = getAllCaptureSequences(game, square)
    // Return only final destination squares
    return sequences.map(seq => seq.finalSquare)
  }
  
  // Regular moves (only if no mandatory captures exist)
  const moves: Square[] = []
  const [col, row] = squareToCoords(square)
  const directions = getMoveDirections(piece)
  
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
  
  return moves
}

/**
 * Get all possible capture sequences from a given square
 * This includes single captures and multiple captures (series)
 * Returns only maximal sequences (those that cannot be continued)
 * 
 * @param {CheckersGame} game - Current game state
 * @param {Square} square - Starting square
 * @returns {CaptureSequence[]} Array of all possible maximal capture sequences
 */
function getAllCaptureSequences(game: CheckersGame, square: Square): CaptureSequence[] {
  const piece = game.board.get(square)
  if (!piece) return []
  
  const sequences: CaptureSequence[] = []
  const board = new Map(game.board)
  
  // Recursively find all capture sequences
  findCaptureSequencesRecursive(
    board,
    square,
    piece,
    [],
    [square],
    sequences
  )
  
  // Filter to only maximal sequences (those with most captures)
  if (sequences.length === 0) return []
  
  const maxCaptures = Math.max(...sequences.map(seq => seq.capturedSquares.length))
  return sequences.filter(seq => seq.capturedSquares.length === maxCaptures)
}

/**
 * Recursively find all capture sequences from a position
 * 
 * @param {Map<Square, Piece>} board - Current board state (modified during recursion)
 * @param {Square} currentSquare - Current position
 * @param {Piece} piece - Piece making the capture
 * @param {Square[]} capturedSquares - Squares where pieces were captured so far
 * @param {Square[]} path - Path taken so far (including current square)
 * @param {CaptureSequence[]} sequences - Accumulator for all sequences found
 */
function findCaptureSequencesRecursive(
  board: Map<Square, Piece>,
  currentSquare: Square,
  piece: Piece,
  capturedSquares: Square[],
  path: Square[],
  sequences: CaptureSequence[]
): void {
  const [col, row] = squareToCoords(currentSquare)
  const directions = getCaptureDirections(piece)
  let foundAnyCapture = false
  
  // Check all directions for possible captures
  directions.forEach(([dc, dr]) => {
    if (piece.type === 'king') {
      // King capture: find first enemy piece, then check all landing squares after it
      let foundEnemy = false
      let enemySquare: Square | null = null
      
      // First, find the first enemy piece in this direction
      // Path to enemy must be completely clear (all squares empty)
      for (let distance = 1; distance < 8; distance++) {
        const checkCol = col + dc * distance
        const checkRow = row + dr * distance
        if (!isValidSquare(checkCol, checkRow)) break
        
        if (isDarkSquare(checkRow - 1, checkCol)) {
          const checkSquare = coordsToSquare(checkCol, checkRow)
          const checkPiece = board.get(checkSquare)
          
          if (checkPiece) {
            if (checkPiece.color !== piece.color && !foundEnemy && !capturedSquares.includes(checkSquare)) {
              // Found first enemy piece - path before it must be clear (which we've verified by reaching here)
              foundEnemy = true
              enemySquare = checkSquare
            } else {
              // Hit own piece, already captured piece, or second piece - stop searching
              // (In Russian checkers, king cannot jump over two pieces in one jump)
              break
            }
          }
          // If square is empty, continue searching (path is clear so far)
        } else {
          break
        }
      }
      
      // If we found an enemy, check all possible landing squares after it
      if (foundEnemy && enemySquare) {
        const [enemyCol, enemyRow] = squareToCoords(enemySquare)
        
        // Check all squares after the enemy piece
        for (let jumpDist = 1; jumpDist < 8; jumpDist++) {
          const jumpCol = enemyCol + dc * jumpDist
          const jumpRow = enemyRow + dr * jumpDist
          if (!isValidSquare(jumpCol, jumpRow)) break
          
          if (isDarkSquare(jumpRow - 1, jumpCol)) {
            const jumpSquare = coordsToSquare(jumpCol, jumpRow)
            
            // Check if path from current to jump square is clear (except for the enemy)
            let pathClear = true
            for (let i = 1; i < jumpDist; i++) {
              const pathCol = enemyCol + dc * i
              const pathRow = enemyRow + dr * i
              const pathSquare = coordsToSquare(pathCol, pathRow)
              
              if (board.has(pathSquare)) {
                pathClear = false
                break
              }
            }
            
            // Final square must be empty
            if (pathClear && !board.has(jumpSquare)) {
              // Valid capture found
              foundAnyCapture = true
              
              // Create new board state for recursion
              const newBoard = new Map(board)
              newBoard.delete(enemySquare)
              newBoard.delete(currentSquare)
              
              // IMPORTANT: In Russian checkers, promotion happens ONLY after the entire move is complete
              // During the capture chain, the piece remains as it was (man stays man, king stays king)
              // We'll check promotion only at the end of the sequence
              const newPiece: Piece = { color: piece.color, type: piece.type }
              newBoard.set(jumpSquare, newPiece)
              
              // Recursively find more captures from this position
              findCaptureSequencesRecursive(
                newBoard,
                jumpSquare,
                newPiece,
                [...capturedSquares, enemySquare],
                [...path, jumpSquare],
                sequences
              )
            }
          } else {
            break
          }
        }
      }
    } else {
      // Regular piece capture: jump one square over enemy
      const jumpCol = col + dc * 2
      const jumpRow = row + dr * 2
      const middleCol = col + dc
      const middleRow = row + dr
      
      if (isValidSquare(jumpCol, jumpRow) && isDarkSquare(jumpRow - 1, jumpCol)) {
        const middleSquare = coordsToSquare(middleCol, middleRow)
        const jumpSquare = coordsToSquare(jumpCol, jumpRow)
        const middlePiece = board.get(middleSquare)
        
        if (middlePiece && 
            middlePiece.color !== piece.color && 
            !board.has(jumpSquare) &&
            !capturedSquares.includes(middleSquare)) {
          // Valid capture found
          foundAnyCapture = true
          
          // Create new board state for recursion
          const newBoard = new Map(board)
          newBoard.delete(middleSquare)
          newBoard.delete(currentSquare)
          
          // IMPORTANT: In Russian checkers, promotion happens ONLY after the entire move is complete
          // During the capture chain, the piece remains as it was (man stays man)
          // We'll check promotion only at the end of the sequence
          const newPiece: Piece = { color: piece.color, type: piece.type }
          newBoard.set(jumpSquare, newPiece)
          
          // Recursively find more captures from this position
          findCaptureSequencesRecursive(
            newBoard,
            jumpSquare,
            newPiece,
            [...capturedSquares, middleSquare],
            [...path, jumpSquare],
            sequences
          )
        }
      }
    }
  })
  
  // If no more captures possible, this is a complete sequence
  if (!foundAnyCapture && capturedSquares.length > 0) {
    const [finalCol, finalRow] = squareToCoords(currentSquare)
    sequences.push({
      finalSquare: currentSquare,
      capturedSquares: [...capturedSquares],
      path: [...path], // path already includes currentSquare
      finalRow: finalRow
    })
  }
}

/**
 * Execute a complete capture sequence
 * 
 * @param {Map<Square, Piece>} board - Board to modify
 * @param {Square} from - Starting square
 * @param {Square} to - Final destination square
 * @param {Piece} piece - Piece making the capture
 * @returns {Square[]} Array of squares where pieces were captured
 */
function executeCaptureSequence(
  board: Map<Square, Piece>,
  from: Square,
  to: Square,
  piece: Piece
): Square[] {
  const capturedSquares: Square[] = []
  const [fromCol, fromRow] = squareToCoords(from)
  const [toCol, toRow] = squareToCoords(to)
  
  if (piece.type === 'king') {
    // King captures: remove all enemy pieces between from and to
    const colStep = toCol > fromCol ? 1 : -1
    const rowStep = toRow > fromRow ? 1 : -1
    const distance = Math.max(Math.abs(toCol - fromCol), Math.abs(toRow - fromRow))
    
    for (let i = 1; i < distance; i++) {
      const checkCol = fromCol + colStep * i
      const checkRow = fromRow + rowStep * i
      if (!isValidSquare(checkCol, checkRow)) break
      
      const checkSquare = coordsToSquare(checkCol, checkRow)
      const checkPiece = board.get(checkSquare)
      
      if (checkPiece && checkPiece.color !== piece.color) {
        board.delete(checkSquare)
        capturedSquares.push(checkSquare)
      }
    }
  } else {
    // Regular piece: capture is always one square away
    const middleCol = (fromCol + toCol) / 2
    const middleRow = (fromRow + toRow) / 2
    const middleSquare = coordsToSquare(middleCol, middleRow)
    const middlePiece = board.get(middleSquare)
    
    if (middlePiece && middlePiece.color !== piece.color) {
      board.delete(middleSquare)
      capturedSquares.push(middleSquare)
    }
  }
  
  return capturedSquares
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
 * Validates the move, executes captures if needed (including multiple captures),
 * promotes pieces to kings, and checks for game over conditions.
 * 
 * @param {CheckersGame} game - Current game state
 * @param {Square} from - Source square
 * @param {Square} to - Destination square (final position after all captures)
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
  const [toCol, toRow] = squareToCoords(to)
  const [fromCol, fromRow] = squareToCoords(from)
  const isCapture = Math.abs(toCol - fromCol) >= 2 || Math.abs(toRow - fromRow) >= 2
  
  // Find the capture sequence that leads to this destination
  let finalPiece = piece
  let currentSquare = from
  
  if (isCapture) {
    // Find the capture sequence that ends at 'to'
    const sequences = getAllCaptureSequences(game, from)
    const matchingSequence = sequences.find(seq => seq.finalSquare === to)
    
    if (matchingSequence && matchingSequence.path.length > 1) {
      // Execute the entire capture sequence step by step
      const path = matchingSequence.path
      
      for (let i = 0; i < path.length - 1; i++) {
        const fromSquare = path[i]
        const toSquare = path[i + 1]
        const currentPiece = newBoard.get(fromSquare) || piece
        
        // Execute capture for this step
        executeCaptureSequence(newBoard, fromSquare, toSquare, currentPiece)
        newBoard.delete(fromSquare)
        
        // IMPORTANT: During capture chain, piece type does NOT change
        // Promotion happens only after the entire move is complete
        finalPiece = {
          color: currentPiece.color,
          type: currentPiece.type // Keep original type during chain
        }
        
        // Place piece at intermediate position (still as man, not king)
        newBoard.set(toSquare, finalPiece)
        currentSquare = toSquare
      }
      
      // NOW check for promotion - only after the entire capture sequence is complete
      finalPiece = {
        color: piece.color,
        type: checkPromotion(piece, matchingSequence.finalRow)
      }
      newBoard.set(to, finalPiece)
    } else {
      // Fallback: single capture (shouldn't happen if sequences are found correctly)
      executeCaptureSequence(newBoard, from, to, piece)
      newBoard.delete(from)
      finalPiece = {
        color: piece.color,
        type: checkPromotion(piece, toRow)
      }
      newBoard.set(to, finalPiece)
    }
  } else {
    // Regular move (no capture)
    newBoard.delete(from)
    finalPiece = {
      color: piece.color,
      type: checkPromotion(piece, toRow)
    }
    newBoard.set(to, finalPiece)
  }
  
  // Note: In Russian checkers, if a piece becomes a king after completing a capture sequence,
  // the move is complete. The piece cannot continue capturing in the same move after promotion.
  // All possible capture sequences (including those where piece becomes king) are already
  // calculated in getAllCaptureSequences, which returns only maximal sequences.
  
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
  
  // If there are more captures possible, player must continue (don't switch turns)
  // But in Russian checkers, if a piece becomes a king during capture, it can continue
  // For now, we'll switch turns after a capture sequence completes
  // (This can be enhanced later to require continuing captures)
  
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

