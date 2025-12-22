import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNewGame, gameToFen } from '@/lib/checkers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { inviteId } = body

    if (!inviteId) {
      return NextResponse.json({ error: 'Не указано приглашение' }, { status: 400 })
    }

    // Get invite
    const invite = await prisma.gameInvite.findUnique({
      where: { id: inviteId },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    if (!invite) {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 })
    }

    if (invite.toUserId !== user.id) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'Приглашение уже обработано' }, { status: 400 })
    }

    if (new Date(invite.expiresAt) < new Date()) {
      // Mark as expired
      await prisma.gameInvite.update({
        where: { id: inviteId },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.json({ error: 'Приглашение истекло' }, { status: 400 })
    }

    // Create game
    const checkersGame = createNewGame()
    const initialFen = gameToFen(checkersGame)

    // Randomly assign colors for fairness
    const isUserWhite = Math.random() < 0.5
    const whitePlayerId = isUserWhite ? user.id : invite.fromUserId
    const blackPlayerId = isUserWhite ? invite.fromUserId : user.id

    const game = await prisma.game.create({
      data: {
        whitePlayerId,
        blackPlayerId,
        status: 'IN_PROGRESS',
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

    // Update invite
    await prisma.gameInvite.update({
      where: { id: inviteId },
      data: {
        status: 'ACCEPTED',
        gameId: game.id
      }
    })

    return NextResponse.json({ game, inviteId })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error accepting invite:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка принятия приглашения' },
      { status: 500 }
    )
  }
}

