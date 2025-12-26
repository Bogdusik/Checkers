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

    const { toUserId } = await request.json()
    if (!toUserId || toUserId === user.id) {
      return NextResponse.json({ error: 'Неверный получатель' }, { status: 400 })
    }

    const toUser = await prisma.user.findUnique({ where: { id: toUserId } })
    if (!toUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const invite = await prisma.$transaction(async (tx) => {
      await tx.gameInvite.updateMany({
        where: {
          OR: [
            { fromUserId: user.id, toUserId, status: 'PENDING' },
            { fromUserId: toUserId, toUserId: user.id, status: 'PENDING' }
          ],
          expiresAt: { lt: new Date() }
        },
        data: { status: 'EXPIRED' }
      })

      const existing = await tx.gameInvite.findFirst({
        where: {
          OR: [
            { fromUserId: user.id, toUserId, status: 'PENDING' },
            { fromUserId: toUserId, toUserId: user.id, status: 'PENDING' }
          ],
          expiresAt: { gt: new Date() }
        }
      })

      if (existing) {
        throw new Error('Приглашение уже отправлено')
      }

      return await tx.gameInvite.create({
        data: {
          fromUserId: user.id,
          toUserId,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        },
        include: {
          fromUser: { select: { id: true, username: true, email: true } },
          toUser: { select: { id: true, username: true, email: true } }
        }
      })
    })

    return NextResponse.json({ invite })
  } catch (error: any) {
    if (error?.message === 'Приглашение уже отправлено') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error?.code === 'P1001') {
      return NextResponse.json({ error: 'Ошибка подключения к БД' }, { status: 503 })
    }
    return NextResponse.json({ error: 'Ошибка отправки приглашения' }, { status: 500 })
  }
}
