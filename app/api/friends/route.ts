import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000 // 5 минут для "online"

const userSelect = {
  id: true,
  username: true,
  email: true,
  lastLoginAt: true,
}

async function computePresence(userId: string) {
  const now = Date.now()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  })

  // Check if user is in an active game (IN_PROGRESS and not ended)
  const inGame = await prisma.game.findFirst({
    where: {
      status: 'IN_PROGRESS',
      endedAt: null, // Game must not be ended
      OR: [{ whitePlayerId: userId }, { blackPlayerId: userId }],
    },
    select: { id: true },
  })

  const lastSeen = user?.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0
  const isOnline = !!user?.lastLoginAt && now - lastSeen <= ONLINE_THRESHOLD_MS

  return { user, isOnline, inGame: !!inGame }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const friends = await prisma.friend.findMany({
      where: {
        OR: [
          { requesterId: currentUser.id },
          { addresseeId: currentUser.id },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    })

    const incoming = friends.filter(
      (f) => f.status === 'PENDING' && f.addresseeId === currentUser.id
    )
    const outgoing = friends.filter(
      (f) => f.status === 'PENDING' && f.requesterId === currentUser.id
    )
    const accepted = friends.filter((f) => f.status === 'ACCEPTED')

    const enrich = async (records: typeof friends) => {
      const result = []
      for (const fr of records) {
        const targetId = fr.requesterId === currentUser.id ? fr.addresseeId : fr.requesterId
        const presence = await computePresence(targetId)
        if (presence.user) {
          result.push({
            id: fr.id,
            status: fr.status,
            user: presence.user,
            isOnline: presence.isOnline,
            inGame: presence.inGame,
            requestedByMe: fr.requesterId === currentUser.id,
            createdAt: fr.createdAt,
            acceptedAt: fr.acceptedAt,
          })
        }
      }
      return result
    }

    return NextResponse.json({
      friends: await enrich(accepted),
      incoming: await enrich(incoming),
      outgoing: await enrich(outgoing),
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching friends:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка получения друзей' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const body = await request.json()
    const { target } = body as { target?: string }

    if (!target) {
      return NextResponse.json({ error: 'Укажите email или username' }, { status: 400 })
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: target }, { username: target }],
      },
    })

    if (!targetUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    if (targetUser.id === currentUser.id) {
      return NextResponse.json({ error: 'Нельзя добавить себя' }, { status: 400 })
    }

    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { requesterId: currentUser.id, addresseeId: targetUser.id },
          { requesterId: targetUser.id, addresseeId: currentUser.id },
        ],
      },
    })

    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json({ error: 'Заявка уже отправлена' }, { status: 400 })
      }
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Пользователь уже в друзьях' }, { status: 400 })
      }
      if (existing.status === 'DECLINED') {
        // Позволим повторно отправить, перезапишем статус
        const updated = await prisma.friend.update({
          where: { id: existing.id },
          data: { status: 'PENDING', requesterId: currentUser.id, addresseeId: targetUser.id },
        })
        return NextResponse.json({ request: updated })
      }
    }

    const created = await prisma.friend.create({
      data: {
        requesterId: currentUser.id,
        addresseeId: targetUser.id,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ request: created })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating friend request:', error)
    }
    return NextResponse.json(
      { error: 'Ошибка отправки заявки' },
      { status: 500 }
    )
  }
}

