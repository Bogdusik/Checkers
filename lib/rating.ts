// ELO rating calculation

const K_FACTOR = 32 // Standard K-factor for ELO

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

export function calculateNewRating(
  currentRating: number,
  opponentRating: number,
  actualScore: number // 1 for win, 0.5 for draw, 0 for loss
): number {
  const expectedScore = calculateExpectedScore(currentRating, opponentRating)
  const newRating = Math.round(currentRating + K_FACTOR * (actualScore - expectedScore))
  return Math.max(100, newRating) // Minimum rating is 100
}

export function updateRatings(
  whiteRating: number,
  blackRating: number,
  result: 'white_won' | 'black_won' | 'draw'
): { newWhiteRating: number; newBlackRating: number } {
  let whiteScore: number
  let blackScore: number

  if (result === 'white_won') {
    whiteScore = 1
    blackScore = 0
  } else if (result === 'black_won') {
    whiteScore = 0
    blackScore = 1
  } else {
    whiteScore = 0.5
    blackScore = 0.5
  }

  const newWhiteRating = calculateNewRating(whiteRating, blackRating, whiteScore)
  const newBlackRating = calculateNewRating(blackRating, whiteRating, blackScore)

  return { newWhiteRating, newBlackRating }
}

