import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Get messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const game = await prisma.game.findUnique({
      where: { id: params.id }
    })

    if (!game) {
      return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 })
    }

    // Check if user is part of this game
    if (String(game.whitePlayerId) !== String(user.id) && String(game.blackPlayerId) !== String(user.id)) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const messages = await prisma.gameMessage.findMany({
      where: { gameId: params.id },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100
    })

    return NextResponse.json({ messages })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching messages:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка получения сообщений' },
      { status: 500 }
    )
  }
}

// Send message
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
    const { message } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Сообщение не может быть пустым' }, { status: 400 })
    }

    if (message.length > 500) {
      return NextResponse.json({ error: 'Сообщение слишком длинное (максимум 500 символов)' }, { status: 400 })
    }

    const game = await prisma.game.findUnique({
      where: { id: params.id }
    })

    if (!game) {
      return NextResponse.json({ error: 'Игра не найдена' }, { status: 404 })
    }

    // Check if user is part of this game
    if (String(game.whitePlayerId) !== String(user.id) && String(game.blackPlayerId) !== String(user.id)) {
      return NextResponse.json({ error: 'Нет доступа' }, { status: 403 })
    }

    const newMessage = await prisma.gameMessage.create({
      data: {
        gameId: params.id,
        userId: user.id,
        message: message.trim()
      },
      include: {
        user: {
          select: {
            id: true,
            username: true
          }
        }
      }
    })

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error sending message:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка отправки сообщения' },
      { status: 500 }
    )
  }
}

