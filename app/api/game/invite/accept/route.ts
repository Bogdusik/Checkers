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

    const { inviteId } = await request.json()
    if (!inviteId) {
      return NextResponse.json({ error: 'Не указано приглашение' }, { status: 400 })
    }

    const invite = await prisma.gameInvite.findUnique({
      where: { id: inviteId },
      include: { fromUser: { select: { id: true, username: true, email: true } } }
    })

    if (!invite || String(invite.toUserId) !== String(user.id)) {
      return NextResponse.json({ error: 'Приглашение не найдено' }, { status: 404 })
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'Приглашение уже обработано' }, { status: 400 })
    }

    const game = await prisma.$transaction(async (tx) => {
      const currentInvite = await tx.gameInvite.findUnique({ where: { id: inviteId } })
      
      if (!currentInvite || String(currentInvite.toUserId) !== String(user.id) || currentInvite.status !== 'PENDING') {
        throw new Error('Приглашение недоступно')
      }

      if (new Date(currentInvite.expiresAt) < new Date()) {
        await tx.gameInvite.update({ where: { id: inviteId }, data: { status: 'EXPIRED' } })
        throw new Error('Приглашение истекло')
      }

      const checkersGame = createNewGame()
      const isUserWhite = Math.random() < 0.5
      const whitePlayerId = isUserWhite ? user.id : invite.fromUserId
      const blackPlayerId = isUserWhite ? invite.fromUserId : user.id

      const newGame = await tx.game.create({
        data: {
          whitePlayerId,
          blackPlayerId,
          status: 'IN_PROGRESS',
          startedAt: new Date(),
          fen: gameToFen(checkersGame)
        },
        include: {
          whitePlayer: { select: { id: true, username: true, email: true } },
          blackPlayer: { select: { id: true, username: true, email: true } }
        }
      })

      const updateResult = await tx.gameInvite.updateMany({
        where: { id: inviteId, status: 'PENDING' },
        data: { status: 'ACCEPTED', gameId: newGame.id }
      })

      if (updateResult.count === 0) {
        throw new Error('Приглашение уже обработано')
      }

      return newGame
    })

    return NextResponse.json({ game, inviteId })
  } catch (error: any) {
    const errorMessages = [
      'Приглашение недоступно',
      'Приглашение уже обработано',
      'Приглашение истекло'
    ]
    
    if (errorMessages.includes(error?.message)) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    if (error?.code === 'P1001') {
      return NextResponse.json({ error: 'Ошибка подключения к БД' }, { status: 503 })
    }
    
    return NextResponse.json({ error: 'Ошибка принятия приглашения' }, { status: 500 })
  }
}
