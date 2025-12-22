import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNewGame, gameToFen } from '@/lib/checkers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    // Get waiting games or create new one
    // Find games where white player is NOT current user and blackPlayerId equals whitePlayerId (waiting for opponent)
    const allWaitingGames = await prisma.game.findMany({
      where: {
        status: 'WAITING'
      },
      include: {
        whitePlayer: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    // Find a game where we can join (white player is different and blackPlayerId equals whitePlayerId)
    const waitingGame = allWaitingGames.find(
      (game: any) => String(game.whitePlayerId) !== String(user.id) && String(game.blackPlayerId) === String(game.whitePlayerId)
    )

    if (waitingGame) {
      // Join existing game - randomly assign colors for fairness
      const isUserWhite = Math.random() < 0.5
      const whitePlayerId = isUserWhite ? user.id : waitingGame.whitePlayerId
      const blackPlayerId = isUserWhite ? waitingGame.whitePlayerId : user.id
      
      const updatedGame = await prisma.game.update({
        where: { id: waitingGame.id },
        data: {
          whitePlayerId,
          blackPlayerId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          fen: waitingGame.fen || gameToFen(createNewGame())
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

      return NextResponse.json({ game: updatedGame, joined: true })
    }

    // Create new game
    const checkersGame = createNewGame()
    const initialFen = gameToFen(checkersGame)
    
    const newGame = await prisma.game.create({
      data: {
        whitePlayerId: user.id,
        blackPlayerId: user.id, // Will be updated when someone joins
        status: 'WAITING',
        fen: initialFen
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

    return NextResponse.json({ game: newGame, joined: false })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error in lobby:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка создания/поиска игры' },
      { status: 500 }
    )
  }
}

