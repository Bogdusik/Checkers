import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemas, validateRequest } from '@/lib/validation'
import { handleError, NotFoundError, AuthenticationError, AuthorizationError } from '@/lib/errors'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const game = await prisma.game.findUnique({ where: { id: params.id } })
    if (!game || (String(game.whitePlayerId) !== String(user.id) && String(game.blackPlayerId) !== String(user.id))) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const messages = await prisma.gameMessage.findMany({
      where: { gameId: params.id },
      include: { user: { select: { id: true, username: true } } },
      orderBy: { createdAt: 'asc' },
      take: 100
    })

    return NextResponse.json({ messages })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения сообщений' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      throw new AuthenticationError()
    }

    const { message } = validateRequest(schemas.chatMessage, await request.json())
    const game = await prisma.game.findUnique({ where: { id: params.id } })

    if (!game) {
      throw new NotFoundError('Игра не найдена')
    }

    if (String(game.whitePlayerId) !== String(user.id) && String(game.blackPlayerId) !== String(user.id)) {
      throw new AuthorizationError()
    }

    const newMessage = await prisma.gameMessage.create({
      data: { gameId: params.id, userId: user.id, message: message.trim() },
      include: { user: { select: { id: true, username: true } } }
    })

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    const errorResponse = handleError(error)
    return NextResponse.json({ error: errorResponse.message }, { status: errorResponse.statusCode })
  }
}
