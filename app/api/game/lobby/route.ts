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

    const result = await prisma.$transaction(async (tx) => {
      // Waiting games are stored with whitePlayerId === blackPlayerId (creator as both sides)
      // Find the oldest one not created by current user, lock it for update
      const waitingGames = await tx.game.findMany({
        where: {
          status: 'WAITING',
          whitePlayerId: { not: user.id }
        },
        orderBy: { createdAt: 'asc' },
        take: 10
      })
      const matchable = waitingGames.find(g => g.whitePlayerId === g.blackPlayerId) ?? null

      if (matchable) {
        const isUserWhite = Math.random() < 0.5
        const whitePlayerId = isUserWhite ? user.id : matchable.whitePlayerId
        const blackPlayerId = isUserWhite ? matchable.whitePlayerId : user.id

        const updatedGame = await tx.game.update({
          where: { id: matchable.id },
          data: {
            whitePlayerId,
            blackPlayerId,
            status: 'IN_PROGRESS',
            startedAt: new Date(),
            fen: matchable.fen || gameToFen(createNewGame())
          },
          include: {
            whitePlayer: { select: { id: true, username: true, email: true } },
            blackPlayer: { select: { id: true, username: true, email: true } }
          }
        })
        return { game: updatedGame, joined: true }
      }

      const checkersGame = createNewGame()
      const newGame = await tx.game.create({
        data: {
          whitePlayerId: user.id,
          blackPlayerId: user.id,
          status: 'WAITING',
          fen: gameToFen(checkersGame)
        },
        include: {
          whitePlayer: { select: { id: true, username: true, email: true } },
          blackPlayer: { select: { id: true, username: true, email: true } }
        }
      })
      return { game: newGame, joined: false }
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка создания/поиска игры' }, { status: 500 })
  }
}
