// Checkers game logic

export type PieceColor = 'white' | 'black'
export type PieceType = 'man' | 'king'
export type Square = string // e.g., "a1", "b2"

export interface Piece {
  color: PieceColor
  type: PieceType
}

export interface CheckersGame {
  board: Map<Square, Piece>
  currentPlayer: PieceColor
  gameOver: boolean
  winner: PieceColor | null
}

// Initialize checkers board
export function createNewGame(): CheckersGame {
  const board = new Map<Square, Piece>()
  
  // Place white pieces (bottom 3 rows - rows 1, 2, 3)
  const whiteRows = ['1', '2', '3']
  whiteRows.forEach((row, rowIndex) => {
    const startCol = rowIndex % 2 === 0 ? 1 : 0
    for (let col = startCol; col < 8; col += 2) {
      const square = String.fromCharCode(97 + col) + row
      board.set(square, { color: 'white', type: 'man' })
    }
  })
  
  // Place black pieces (top 3 rows - rows 6, 7, 8)
  const blackRows = ['6', '7', '8']
  blackRows.forEach((row, rowIndex) => {
    const startCol = rowIndex % 2 === 0 ? 0 : 1
    for (let col = startCol; col < 8; col += 2) {
      const square = String.fromCharCode(97 + col) + row
      board.set(square, { color: 'black', type: 'man' })
    }
  })
  
  return {
    board,
    currentPlayer: 'white',
    gameOver: false,
    winner: null
  }
}

// Convert game to FEN-like string for storage
export function gameToFen(game: CheckersGame): string {
  const pieces: string[] = []
  for (let row = 8; row >= 1; row--) {
    let rowStr = ''
    for (let col = 0; col < 8; col++) {
      const square = String.fromCharCode(97 + col) + row
      const piece = game.board.get(square)
      if (piece) {
        if (piece.color === 'white') {
          rowStr += piece.type === 'king' ? 'W' : 'w'
        } else {
          rowStr += piece.type === 'king' ? 'B' : 'b'
        }
      } else {
        rowStr += '-'
      }
    }
    pieces.push(rowStr)
  }
  return pieces.join('/') + ' ' + game.currentPlayer[0] + ' ' + (game.gameOver ? '1' : '0')
}

// Parse FEN-like string to game
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
        const square = String.fromCharCode(97 + colIndex) + actualRow
        // In FEN: 'w'/'W' = white, 'b'/'B' = black
        // Uppercase = king, lowercase = man
        const isWhite = char.toLowerCase() === 'w'
        const isKing = char === char.toUpperCase()
        const color: PieceColor = isWhite ? 'white' : 'black'
        const type: PieceType = isKing ? 'king' : 'man'
        board.set(square, { color, type })
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

// Get valid moves for a piece
export function getValidMoves(game: CheckersGame, square: Square): Square[] {
  const piece = game.board.get(square)
  if (!piece || piece.color !== game.currentPlayer) {
    return []
  }
  
  const moves: Square[] = []
  const [col, row] = [square[0].charCodeAt(0) - 97, parseInt(square[1])]
  
  // Only dark squares are valid (checkers are only on dark squares)
  const isDarkSquare = (r: number, c: number) => (r + c) % 2 === 1
  
  // Check for captures first (mandatory)
  const captures = getCaptures(game, square)
  
  // If there are any mandatory captures for this player, only allow captures
  const hasAnyCaptures = hasMandatoryCaptures(game)
  if (hasAnyCaptures) {
    // If this piece has captures, return only captures
    // If this piece doesn't have captures, return empty (can't move this piece when captures are mandatory)
    return captures
  }
  
  // If no mandatory captures exist, allow both regular moves and captures for this piece
  // Add captures to moves if they exist, but also allow regular moves
  
  // Regular moves
  // White pieces are at bottom (rows 1,2,3) and move UP (increasing row: 1->2->3->4...)
  // Black pieces are at top (rows 6,7,8) and move DOWN (decreasing row: 8->7->6->5...)
  const directions = piece.type === 'king' 
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]  // Kings can move in all 4 diagonal directions
    : piece.color === 'white'
    ? [[-1, 1], [1, 1]]   // White moves up: left-up and right-up (row increases: 1->2->3...)
    : [[-1, -1], [1, -1]] // Black moves down: left-down and right-down (row decreases: 8->7->6...)
  
  directions.forEach(([dc, dr]) => {
    if (piece.type === 'king') {
      // Kings can move multiple squares diagonally until they hit a piece or board edge
      for (let distance = 1; distance < 8; distance++) {
        const newCol = col + dc * distance
        const newRow = row + dr * distance
        if (newCol >= 0 && newCol < 8 && newRow >= 1 && newRow <= 8) {
          // Only allow moves to dark squares
          if (isDarkSquare(newRow - 1, newCol)) {
            const newSquare = String.fromCharCode(97 + newCol) + newRow
            const squarePiece = game.board.get(newSquare)
            if (!squarePiece) {
              moves.push(newSquare)
            } else {
              // Stop if we hit any piece (our own or enemy)
              break
            }
          } else {
            break
          }
        } else {
          break
        }
      }
    } else {
      // Regular pieces (men) can only move one square forward diagonally
      // White moves up (row increases: 1->2->3...), Black moves down (row decreases: 8->7->6...)
      const newCol = col + dc
      const newRow = row + dr
      if (newCol >= 0 && newCol < 8 && newRow >= 1 && newRow <= 8) {
        // Only allow moves to dark squares
        if (isDarkSquare(newRow - 1, newCol)) {
          const newSquare = String.fromCharCode(97 + newCol) + newRow
          if (!game.board.has(newSquare)) {
            moves.push(newSquare)
          }
        }
      }
    }
  })
  
  // If there are no mandatory captures, include both regular moves and captures
  // Add captures to the moves array
  captures.forEach(capture => {
    if (!moves.includes(capture)) {
      moves.push(capture)
    }
  })
  
  return moves
}

// Get capture moves
function getCaptures(game: CheckersGame, square: Square): Square[] {
  const piece = game.board.get(square)
  if (!piece) return []
  
  const captures: Square[] = []
  const [col, row] = [square[0].charCodeAt(0) - 97, parseInt(square[1])]
  
  // Only dark squares are valid
  const isDarkSquare = (r: number, c: number) => (r + c) % 2 === 1
  
  const directions = piece.type === 'king'
    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
    : piece.color === 'white'
    ? [[-1, 1], [1, 1]]   // White captures up
    : [[-1, -1], [1, -1]] // Black captures down
  
  directions.forEach(([dc, dr]) => {
    if (piece.type === 'king') {
      // Kings can capture by jumping over enemy pieces at any distance
      // Find the first enemy piece in this direction
      let foundEnemy = false
      let enemySquare: Square | null = null
      
      for (let distance = 1; distance < 8; distance++) {
        const checkCol = col + dc * distance
        const checkRow = row + dr * distance
        if (checkCol >= 0 && checkCol < 8 && checkRow >= 1 && checkRow <= 8) {
          if (isDarkSquare(checkRow - 1, checkCol)) {
            const checkSquare = String.fromCharCode(97 + checkCol) + checkRow
            const checkPiece = game.board.get(checkSquare)
            
            if (checkPiece) {
              if (checkPiece.color !== piece.color && !foundEnemy) {
                // Found an enemy piece
                foundEnemy = true
                enemySquare = checkSquare
              } else {
                // Hit our own piece or another piece after enemy - stop
                break
              }
            }
          } else {
            break
          }
        } else {
          break
        }
      }
      
      // If we found an enemy piece, check if we can jump over it
      if (foundEnemy && enemySquare) {
        const [enemyCol, enemyRow] = [enemySquare[0].charCodeAt(0) - 97, parseInt(enemySquare[1])]
        const jumpCol = enemyCol + dc
        const jumpRow = enemyRow + dr
        
        if (jumpCol >= 0 && jumpCol < 8 && jumpRow >= 1 && jumpRow <= 8) {
          if (isDarkSquare(jumpRow - 1, jumpCol)) {
            const jumpSquare = String.fromCharCode(97 + jumpCol) + jumpRow
            if (!game.board.has(jumpSquare)) {
              captures.push(jumpSquare)
            }
          }
        }
      }
    } else {
      // Regular pieces can only capture by jumping one square
      const jumpCol = col + dc * 2
      const jumpRow = row + dr * 2
      const middleCol = col + dc
      const middleRow = row + dr
      
      if (jumpCol >= 0 && jumpCol < 8 && jumpRow >= 1 && jumpRow <= 8) {
        // Only allow captures to dark squares
        if (isDarkSquare(jumpRow - 1, jumpCol)) {
          const middleSquare = String.fromCharCode(97 + middleCol) + middleRow
          const jumpSquare = String.fromCharCode(97 + jumpCol) + jumpRow
          const middlePiece = game.board.get(middleSquare)
          
          if (middlePiece && middlePiece.color !== piece.color && !game.board.has(jumpSquare)) {
            captures.push(jumpSquare)
          }
        }
      }
    }
  })
  
  return captures
}

// Make a move
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
  
  // Check if it's a capture
  const [fromCol, fromRow] = [from[0].charCodeAt(0) - 97, parseInt(from[1])]
  const [toCol, toRow] = [to[0].charCodeAt(0) - 97, parseInt(to[1])]
  const colDiff = toCol - fromCol
  const rowDiff = toRow - fromRow
  const isCapture = Math.abs(colDiff) >= 2 || Math.abs(rowDiff) >= 2
  
  // Check for promotion to king FIRST (before capture logic, as promotion can happen during capture)
  let newType: PieceType = piece.type
  if (piece.type === 'man') {
    if (piece.color === 'white' && toRow === 8) {
      newType = 'king'
    } else if (piece.color === 'black' && toRow === 1) {
      newType = 'king'
    }
  }
  
  // Use the new type for capture logic if piece was promoted
  const effectiveType = newType === 'king' ? 'king' : piece.type
  
  if (isCapture) {
    // Remove captured piece(s)
    // For kings, we need to find all enemy pieces between from and to
    if (effectiveType === 'king') {
      const colStep = colDiff > 0 ? 1 : -1
      const rowStep = rowDiff > 0 ? 1 : -1
      const distance = Math.abs(colDiff)
      
      for (let i = 1; i < distance; i++) {
        const checkCol = fromCol + colStep * i
        const checkRow = fromRow + rowStep * i
        const checkSquare = String.fromCharCode(97 + checkCol) + checkRow
        const checkPiece = newBoard.get(checkSquare)
        
        if (checkPiece && checkPiece.color !== piece.color) {
          // Found an enemy piece to capture
          newBoard.delete(checkSquare)
        }
      }
    } else {
      // Regular piece - capture is always exactly one square away
      const middleCol = (fromCol + toCol) / 2
      const middleRow = (fromRow + toRow) / 2
      const middleSquare = String.fromCharCode(97 + middleCol) + middleRow
      newBoard.delete(middleSquare)
    }
  }
  
  // Always set the piece with the correct type (important for newly promoted kings)
  newBoard.set(to, { color: piece.color, type: newType })
  
  // Check for game over
  const opponentColor = game.currentPlayer === 'white' ? 'black' : 'white'
  const opponentPieces = Array.from(newBoard.values()).filter(p => p.color === opponentColor)
  const gameOver = opponentPieces.length === 0
  
  const newGame: CheckersGame = {
    board: newBoard,
    currentPlayer: gameOver ? game.currentPlayer : opponentColor,
    gameOver,
    winner: gameOver ? game.currentPlayer : null
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

