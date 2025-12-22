import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { makeMove, gameToFen, fenToGame, getGameStatus, type CheckersGame } from '@/lib/checkers'
import { GameStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
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
    if (game.whitePlayerId !== user.id && game.blackPlayerId !== user.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    // Check game status
    if (game.status !== 'IN_PROGRESS' && game.status !== 'WAITING') {
      return NextResponse.json({ error: 'Игра завершена' }, { status: 400 })
    }

    // Create checkers game instance from current FEN
    const checkersGame = fenToGame(game.fen)
    
    // Check if playing against self
    const isPlayingAgainstSelf = game.whitePlayerId === game.blackPlayerId && game.whitePlayerId === user.id
    
    // Check whose turn it is
    // If playing against self, allow moving any piece on current player's turn
    if (!isPlayingAgainstSelf) {
      const playerColor = game.whitePlayerId === user.id ? 'white' : 'black'
      if (checkersGame.currentPlayer !== playerColor) {
        return NextResponse.json({ error: 'Не ваш ход' }, { status: 400 })
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
        }
      })

      // Update statistics if game ended
      if (gameStatus === 'WHITE_WON' || gameStatus === 'BLACK_WON' || gameStatus === 'DRAW') {
        const isPlayingAgainstSelf = game.whitePlayerId === game.blackPlayerId

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
          // Update white player stats
          const whiteStats = await prisma.userStatistics.findUnique({
            where: { userId: game.whitePlayerId }
          })

          if (whiteStats) {
            await prisma.userStatistics.update({
              where: { userId: game.whitePlayerId },
              data: {
                totalGames: whiteStats.totalGames + 1,
                wins: gameStatus === 'WHITE_WON' ? whiteStats.wins + 1 : whiteStats.wins,
                losses: gameStatus === 'BLACK_WON' ? whiteStats.losses + 1 : whiteStats.losses,
                draws: gameStatus === 'DRAW' ? whiteStats.draws + 1 : whiteStats.draws,
                totalMoves: whiteStats.totalMoves + moveNumber
              }
            })
          }

          // Update black player stats
          const blackStats = await prisma.userStatistics.findUnique({
            where: { userId: game.blackPlayerId }
          })

          if (blackStats) {
            await prisma.userStatistics.update({
              where: { userId: game.blackPlayerId },
              data: {
                totalGames: blackStats.totalGames + 1,
                wins: gameStatus === 'BLACK_WON' ? blackStats.wins + 1 : blackStats.wins,
                losses: gameStatus === 'WHITE_WON' ? blackStats.losses + 1 : blackStats.losses,
                draws: gameStatus === 'DRAW' ? blackStats.draws + 1 : blackStats.draws,
                totalMoves: blackStats.totalMoves + moveNumber
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
      return NextResponse.json(
        { error: 'Неверный ход: ' + error.message },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error making move:', error)
    return NextResponse.json(
      { error: 'Ошибка выполнения хода' },
      { status: 500 }
    )
  }
}
