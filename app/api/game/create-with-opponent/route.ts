import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNewGame, gameToFen } from '@/lib/checkers'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { opponentId } = body

    // If opponentId is null, play against self
    // If opponentId is provided and different from user.id, create game with that opponent
    // If opponentId equals user.id, also play against self

    const checkersGame = createNewGame()
    const initialFen = gameToFen(checkersGame)

    const isPlayingAgainstSelf = opponentId === null || opponentId === user.id
    const finalOpponentId = isPlayingAgainstSelf ? user.id : opponentId

    // Randomly assign colors for fairness
    const isUserWhite = Math.random() < 0.5
    const whitePlayerId = isUserWhite ? user.id : finalOpponentId
    const blackPlayerId = isUserWhite ? finalOpponentId : user.id

    const game = await prisma.game.create({
      data: {
        whitePlayerId,
        blackPlayerId,
        status: isPlayingAgainstSelf ? 'IN_PROGRESS' : 'IN_PROGRESS',
        startedAt: new Date(),
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

    return NextResponse.json({ game })
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Ошибка создания игры' },
      { status: 500 }
    )
  }
}

