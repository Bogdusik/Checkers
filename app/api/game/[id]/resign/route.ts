import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateRatings } from '@/lib/rating'
import { GameStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        whitePlayer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        blackPlayer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 })
    }

    // Check if user is part of this game
    if (String(game.whitePlayerId) !== String(user.id) && String(game.blackPlayerId) !== String(user.id)) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    // Check game status
    if (game.status !== 'IN_PROGRESS' && game.status !== 'WAITING') {
      return NextResponse.json({ error: 'Игра уже завершена' }, { status: 400 })
    }

    // Determine winner (opponent)
    const isWhitePlayer = String(game.whitePlayerId) === String(user.id)
    const winnerId = isWhitePlayer ? game.blackPlayerId : game.whitePlayerId
    const gameStatus: GameStatus = isWhitePlayer ? 'BLACK_WON' : 'WHITE_WON'

    // Update game
    const updatedGame = await prisma.game.update({
      where: { id: params.id },
      data: {
        status: gameStatus,
        winnerId,
        endedAt: new Date()
      },
      include: {
        whitePlayer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        blackPlayer: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    // Update statistics
    const isPlayingAgainstSelf = String(game.whitePlayerId) === String(game.blackPlayerId)

    if (!isPlayingAgainstSelf) {
      // Get both players' stats for rating calculation
      const winnerStats = await prisma.userStatistics.findUnique({
        where: { userId: winnerId }
      })

      const loserStats = await prisma.userStatistics.findUnique({
        where: { userId: user.id }
      })

      // Calculate new ratings
      let newWinnerRating = winnerStats?.rating || 1000
      let newLoserRating = loserStats?.rating || 1000

      if (winnerStats && loserStats) {
        const result = gameStatus === 'WHITE_WON' ? 'white_won' : 'black_won'
        const ratings = updateRatings(
          gameStatus === 'WHITE_WON' ? winnerStats.rating : loserStats.rating,
          gameStatus === 'WHITE_WON' ? loserStats.rating : winnerStats.rating,
          result
        )
        if (gameStatus === 'WHITE_WON') {
          newWinnerRating = ratings.newWhiteRating
          newLoserRating = ratings.newBlackRating
        } else {
          newWinnerRating = ratings.newBlackRating
          newLoserRating = ratings.newWhiteRating
        }
      }

      // Update winner stats
      if (winnerStats) {
        await prisma.userStatistics.update({
          where: { userId: winnerId },
          data: {
            totalGames: winnerStats.totalGames + 1,
            wins: winnerStats.wins + 1,
            rating: newWinnerRating
          }
        })
      }

      // Update loser stats
      if (loserStats) {
        await prisma.userStatistics.update({
          where: { userId: user.id },
          data: {
            totalGames: loserStats.totalGames + 1,
            losses: loserStats.losses + 1,
            rating: newLoserRating
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      game: updatedGame
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error resigning:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка при сдаче' },
      { status: 500 }
    )
  }
}

