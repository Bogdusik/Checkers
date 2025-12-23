import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { makeMove, gameToFen, fenToGame, getGameStatus, type CheckersGame, type Square } from '@/lib/checkers'
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

    // Update user's lastLoginAt to track online status (non-blocking)
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
    } catch (updateError) {
      // If update fails, log but don't block the request
      console.error('Failed to update lastLoginAt:', updateError)
    }

    const body = await request.json()
    const { from, to } = body

    if (!from || !to) {
      return NextResponse.json({ error: 'Неверный формат хода' }, { status: 400 })
    }

    const game = await prisma.game.findUnique({
      where: { id: params.id },
      include: {
        moves: {
          orderBy: { moveNumber: 'desc' },
          take: 1
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
      return NextResponse.json({ error: 'Игра завершена' }, { status: 400 })
    }

    // Create checkers game instance from current FEN
    const checkersGame = fenToGame(game.fen)
    
    // Check if playing against self
    const isPlayingAgainstSelf = String(game.whitePlayerId) === String(game.blackPlayerId) && String(game.whitePlayerId) === String(user.id)
    
    // Check whose turn it is
    // If playing against self, allow moving any piece on current player's turn
    if (!isPlayingAgainstSelf) {
      const playerColor = String(game.whitePlayerId) === String(user.id) ? 'white' : 'black'
      
      if (checkersGame.currentPlayer !== playerColor) {
        return NextResponse.json({ 
          error: `Не ваш ход. Сейчас ходят: ${checkersGame.currentPlayer === 'white' ? 'белые' : 'черные'}` 
        }, { status: 400 })
      }
      
      // Also verify that the piece being moved belongs to the player
      const piece = checkersGame.board.get(from as Square)
      if (!piece || piece.color !== playerColor) {
        return NextResponse.json({ 
          error: 'Вы можете ходить только своими шашками' 
        }, { status: 400 })
      }
    }
    // If playing against self, allow moving any piece on current player's turn (no check needed)

    // Make move
    try {
      const result = makeMove(checkersGame, from, to)
      
      if (!result.success) {
        return NextResponse.json({ error: 'Неверный ход' }, { status: 400 })
      }

      const newFen = gameToFen(result.newGame)
      const status = getGameStatus(result.newGame)

      // Determine game status
      let gameStatus: GameStatus
      let winnerId: string | null = null

      if (status === 'white_won') {
        gameStatus = 'WHITE_WON'
        winnerId = game.whitePlayerId
      } else if (status === 'black_won') {
        gameStatus = 'BLACK_WON'
        winnerId = game.blackPlayerId
      } else if (status === 'draw') {
        gameStatus = 'DRAW'
      } else {
        // Game is still in progress
        gameStatus = 'IN_PROGRESS'
      }

      // Get move number
      const lastMove = game.moves[0]
      const moveNumber = lastMove ? lastMove.moveNumber + 1 : 1

      // Update game
      const updatedGame = await prisma.game.update({
        where: { id: params.id },
        data: {
          fen: newFen,
          status: gameStatus,
          winnerId,
          startedAt: game.startedAt || new Date(),
          endedAt: (gameStatus === 'WHITE_WON' || gameStatus === 'BLACK_WON' || gameStatus === 'DRAW') ? new Date() : null,
          moves: {
            create: {
              move: `${from}-${to}`,
              fen: newFen,
              moveNumber
            }
          }
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

      // Update statistics if game ended
      if (gameStatus === 'WHITE_WON' || gameStatus === 'BLACK_WON' || gameStatus === 'DRAW') {
        const isPlayingAgainstSelf = String(game.whitePlayerId) === String(game.blackPlayerId)

        if (isPlayingAgainstSelf) {
          // When playing against self, update stats only once
          const stats = await prisma.userStatistics.findUnique({
            where: { userId: game.whitePlayerId }
          })

          if (stats) {
            await prisma.userStatistics.update({
              where: { userId: game.whitePlayerId },
              data: {
                totalGames: stats.totalGames + 1,
                // When playing against self, one side wins and the other loses
                wins: gameStatus === 'WHITE_WON' || gameStatus === 'BLACK_WON' ? stats.wins + 1 : stats.wins,
                losses: gameStatus === 'WHITE_WON' || gameStatus === 'BLACK_WON' ? stats.losses + 1 : stats.losses,
                draws: gameStatus === 'DRAW' ? stats.draws + 1 : stats.draws,
                totalMoves: stats.totalMoves + moveNumber
              }
            })
          }
        } else {
          // Get both players' stats for rating calculation
          const whiteStats = await prisma.userStatistics.findUnique({
            where: { userId: game.whitePlayerId }
          })

          const blackStats = await prisma.userStatistics.findUnique({
            where: { userId: game.blackPlayerId }
          })

          // Calculate new ratings
          let newWhiteRating = whiteStats?.rating || 1000
          let newBlackRating = blackStats?.rating || 1000

          if (whiteStats && blackStats) {
            const result = gameStatus === 'WHITE_WON' ? 'white_won' : 
                          gameStatus === 'BLACK_WON' ? 'black_won' : 'draw'
            const ratings = updateRatings(whiteStats.rating, blackStats.rating, result)
            newWhiteRating = ratings.newWhiteRating
            newBlackRating = ratings.newBlackRating
          }

          // Update white player stats
          if (whiteStats) {
            await prisma.userStatistics.update({
              where: { userId: game.whitePlayerId },
              data: {
                totalGames: whiteStats.totalGames + 1,
                wins: gameStatus === 'WHITE_WON' ? whiteStats.wins + 1 : whiteStats.wins,
                losses: gameStatus === 'BLACK_WON' ? whiteStats.losses + 1 : whiteStats.losses,
                draws: gameStatus === 'DRAW' ? whiteStats.draws + 1 : whiteStats.draws,
                totalMoves: whiteStats.totalMoves + moveNumber,
                rating: newWhiteRating
              }
            })
          }

          // Update black player stats
          if (blackStats) {
            await prisma.userStatistics.update({
              where: { userId: game.blackPlayerId },
              data: {
                totalGames: blackStats.totalGames + 1,
                wins: gameStatus === 'BLACK_WON' ? blackStats.wins + 1 : blackStats.wins,
                losses: gameStatus === 'WHITE_WON' ? blackStats.losses + 1 : blackStats.losses,
                draws: gameStatus === 'DRAW' ? blackStats.draws + 1 : blackStats.draws,
                totalMoves: blackStats.totalMoves + moveNumber,
                rating: newBlackRating
              }
            })
          }
        }
      }

      return NextResponse.json({
        success: true,
        game: updatedGame,
        move: `${from}-${to}`,
        fen: newFen,
        status: gameStatus
      })
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Move validation error:', error)
      }
      return NextResponse.json(
        { error: 'Неверный ход: ' + (error.message || 'Неизвестная ошибка') },
        { status: 400 }
      )
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error making move:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка выполнения хода' },
      { status: 500 }
    )
  }
}
