import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { schemas } from '@/lib/validation'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const friends = await prisma.friend.findMany({
      where: {
        OR: [{ requesterId: currentUser.id }, { addresseeId: currentUser.id }]
      },
      include: {
        requester: { select: { id: true, username: true, email: true, lastLoginAt: true } },
        addressee: { select: { id: true, username: true, email: true, lastLoginAt: true } }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Collect unique user IDs to batch-check in-game status
    const userIds = [...new Set(friends.flatMap(f => [f.requesterId, f.addresseeId]))].filter(
      id => id !== currentUser.id
    )

    const activeGames = await prisma.game.findMany({
      where: {
        status: 'IN_PROGRESS',
        endedAt: null,
        OR: userIds.map(id => ({ whitePlayerId: id })).concat(userIds.map(id => ({ blackPlayerId: id })))
      },
      select: { whitePlayerId: true, blackPlayerId: true }
    })

    const inGameSet = new Set(activeGames.flatMap(g => [g.whitePlayerId, g.blackPlayerId]))

    const now = Date.now()
    const enrich = (records: typeof friends) =>
      records.map(fr => {
        const isRequester = fr.requesterId === currentUser.id
        const other = isRequester ? fr.addressee : fr.requester
        const lastSeen = other.lastLoginAt ? new Date(other.lastLoginAt).getTime() : 0
        return {
          id: fr.id,
          status: fr.status,
          user: { id: other.id, username: other.username, email: other.email, lastLoginAt: other.lastLoginAt },
          isOnline: !!other.lastLoginAt && now - lastSeen <= ONLINE_THRESHOLD_MS,
          inGame: inGameSet.has(other.id),
          requestedByMe: isRequester,
          createdAt: fr.createdAt,
          acceptedAt: (fr as any).acceptedAt
        }
      })

    return NextResponse.json({
      friends: enrich(friends.filter(f => f.status === 'ACCEPTED')),
      incoming: enrich(friends.filter(f => f.status === 'PENDING' && f.addresseeId === currentUser.id)),
      outgoing: enrich(friends.filter(f => f.status === 'PENDING' && f.requesterId === currentUser.id))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка получения друзей' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    let target: string
    try {
      const body = schemas.friendRequest.parse(await request.json())
      target = body.target
    } catch {
      return NextResponse.json({ error: 'Укажите email или username' }, { status: 400 })
    }

    const targetUser = await prisma.user.findFirst({
      where: { OR: [{ email: target }, { username: target }] }
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
          { requesterId: targetUser.id, addresseeId: currentUser.id }
        ]
      }
    })

    if (existing) {
      if (existing.status === 'PENDING') {
        return NextResponse.json({ error: 'Заявка уже отправлена' }, { status: 400 })
      }
      if (existing.status === 'ACCEPTED') {
        return NextResponse.json({ error: 'Пользователь уже в друзьях' }, { status: 400 })
      }
      if (existing.status === 'DECLINED') {
        const updated = await prisma.friend.update({
          where: { id: existing.id },
          data: { status: 'PENDING', requesterId: currentUser.id, addresseeId: targetUser.id }
        })
        return NextResponse.json({ request: updated })
      }
    }

    const created = await prisma.friend.create({
      data: {
        requesterId: currentUser.id,
        addresseeId: targetUser.id,
        status: 'PENDING'
      }
    })

    return NextResponse.json({ request: created })
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка отправки заявки' }, { status: 500 })
  }
}
