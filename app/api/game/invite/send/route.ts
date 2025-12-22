import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { toUserId } = body

    if (!toUserId) {
      return NextResponse.json({ error: 'Не указан получатель приглашения' }, { status: 400 })
    }

    if (toUserId === user.id) {
      return NextResponse.json({ error: 'Нельзя пригласить самого себя' }, { status: 400 })
    }

    // Check if user exists
    const toUser = await prisma.user.findUnique({
      where: { id: toUserId }
    })

    if (!toUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.gameInvite.findFirst({
      where: {
        OR: [
          { fromUserId: user.id, toUserId, status: 'PENDING' },
          { fromUserId: toUserId, toUserId: user.id, status: 'PENDING' }
        ]
      }
    })

    if (existingInvite) {
      return NextResponse.json({ error: 'Приглашение уже отправлено' }, { status: 400 })
    }

    // Create invite
    const invite = await prisma.gameInvite.create({
      data: {
        fromUserId: user.id,
        toUserId,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      },
      include: {
        fromUser: {
          select: {
            id: true,
            username: true,
            email: true
          }
        },
        toUser: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ invite })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error sending invite:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка отправки приглашения' },
      { status: 500 }
    )
  }
}

