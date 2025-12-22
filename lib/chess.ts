import { Chess } from 'chess.js'

export function createNewGame() {
  return new Chess()
}

export function makeMove(game: Chess, move: string): boolean {
  try {
    const result = game.move(move)
    return result !== null
  } catch {
    return false
  }
}

export function getGameStatus(game: Chess): 'in_progress' | 'checkmate' | 'stalemate' | 'draw' {
  if (game.isCheckmate()) return 'checkmate'
  if (game.isStalemate()) return 'stalemate'
  if (game.isDraw()) return 'draw'
  return 'in_progress'
}

export function getWinner(game: Chess, status: string): 'white' | 'black' | null {
  if (status === 'checkmate') {
    return game.turn() === 'w' ? 'black' : 'white'
  }
  return null
}

