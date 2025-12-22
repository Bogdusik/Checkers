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

    // Create checkers game
    const checkersGame = createNewGame()
    const initialFen = gameToFen(checkersGame)

    // Create game
    const game = await prisma.game.create({
      data: {
        whitePlayerId: user.id,
        blackPlayerId: opponentId || user.id, // For now, can play against self or wait for opponent
        status: opponentId ? 'IN_PROGRESS' : 'WAITING',
        startedAt: opponentId ? new Date() : null,
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

